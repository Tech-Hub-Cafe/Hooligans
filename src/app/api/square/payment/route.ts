import { NextResponse } from "next/server";
import { createPayment, createSquareOrder, dollarsToSquareMoney } from "@/lib/square";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { randomUUID } from "crypto";
import { sendReceipt, sendOrderConfirmation } from "@/lib/email";
import { sendOrderConfirmationSMS, isSMSConfigured } from "@/lib/sms";

interface Order {
  id: number;
  total: number;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      sourceId, // Payment token from Square Web Payments SDK
      orderId,
      amount,
      customerEmail,
      customerName,
      customerPhone, // Customer phone number for SMS
      orderItems, // Cart items to create Square Order
      specialInstructions, // Special instructions for the order
    } = body;

    if (!sourceId || !amount) {
      return NextResponse.json(
        { error: "Missing required payment information" },
        { status: 400 }
      );
    }

    // Get user session if available
    const session = await auth();
    const userId = session?.user?.id || null;

    // If Square is configured, process payment through Square
    if (process.env.SQUARE_ACCESS_TOKEN && process.env.SQUARE_LOCATION_ID) {
      try {
        let squareOrderId = null;
        let payment = null;

        // 1. Create Square Order FIRST to get the Order ID
        let lineItems: any[] = [];
        if (orderItems && Array.isArray(orderItems) && orderItems.length > 0) {
          try {
            // Convert cart items to Square Order line items
            lineItems = orderItems.map((item: any) => {
              const lineItem: any = {
                name: item.name,
                quantity: item.quantity.toString(),
              };

              // Don't use catalog IDs - they may be stale or from wrong environment
              // Square accepts ad-hoc items with just name + price

              // Add base price
              const basePrice = item.basePrice || item.price - (item.modifiers?.reduce((sum: number, m: any) => sum + (m.modifierPrice || 0), 0) || 0);
              lineItem.basePriceMoney = {
                amount: BigInt(dollarsToSquareMoney(basePrice)),
                currency: "AUD",
              };

              // Add modifiers if any (without catalog IDs)
              if (item.modifiers && item.modifiers.length > 0) {
                lineItem.modifiers = item.modifiers.map((mod: any) => ({
                  name: mod.modifierName,
                  basePriceMoney: {
                    amount: BigInt(dollarsToSquareMoney(mod.modifierPrice || 0)),
                    currency: "AUD",
                  },
                }));
              }

              // Add item comment if available
              if (item.comment) {
                lineItem.note = item.comment;
              }

              return lineItem;
            });

            console.log("[Payment API] 📦 Creating Square Order with:", {
              locationId: process.env.SQUARE_LOCATION_ID?.substring(0, 10) + "...",
              lineItemCount: lineItems.length,
              lineItemsPreview: lineItems.map(li => ({
                name: li.name,
                quantity: li.quantity,
                hasPrice: !!li.basePriceMoney,
                modifierCount: li.modifiers?.length || 0,
              })),
              customerNote: specialInstructions || `Order for ${customerName}`,
              referenceId: orderId ? `ORDER-${orderId}` : undefined,
            });

            const squareOrderResponse = await createSquareOrder({
              locationId: process.env.SQUARE_LOCATION_ID!,
              lineItems,
              customerNote: specialInstructions || `Order for ${customerName}`,
              referenceId: orderId ? `ORDER-${orderId}` : undefined,
            });

            if (squareOrderResponse.order?.id) {
              squareOrderId = squareOrderResponse.order.id;
              console.log("[Payment API] Square Order created first:", {
                squareOrderId,
                state: squareOrderResponse.order.state,
              });
            }
          } catch (orderError: any) {
            console.error("[Payment API] ❌ Failed to create Square Order:", {
              errorMessage: orderError.message,
              errorDetail: orderError.detail,
              statusCode: orderError.statusCode,
              errors: orderError.errors,
            });
            console.error("[Payment API] Line items count that failed:", lineItems.length);
            // Proceed to payment even if order creation fails (fallback)
          }
        }

        // 2. Create Payment linked to the Order (if order created)
        const paymentResponse = await createPayment({
          sourceId,
          idempotencyKey: randomUUID(),
          amountMoney: {
            amount: dollarsToSquareMoney(amount),
            currency: "AUD", // Australia uses AUD
          },
          locationId: process.env.SQUARE_LOCATION_ID!,
          buyerEmailAddress: customerEmail,
          note: `Order for ${customerName}`,
          orderId: squareOrderId || undefined, // Link to the newly created order
        });

        payment = paymentResponse.payment;
        console.log("[Payment API] Payment response:", {
          paymentId: payment?.id,
          status: payment?.status,
          orderId: payment?.orderId || "none (unitemized)",
        });

        // Square payment statuses: APPROVED, COMPLETED, CANCELED, FAILED, PENDING
        if (payment?.status === "COMPLETED" || payment?.status === "APPROVED") {
          // Update order status in database
          if (orderId) {
            await prisma.order.update({
              where: { id: orderId },
              data: {
                status: "paid",
                square_payment_id: payment.id,
                // Store Square Order ID if available
                ...(squareOrderId && {
                  // Note: consider adding this column to DB schema later
                }),
              },
            });
          }

          // Send notifications (non-blocking - don't fail payment if notifications fail)
          Promise.all([
            // Send email receipt
            sendReceipt({
              to: customerEmail,
              orderNumber: `#${orderId}`,
              items: orderItems,
              total: amount,
              customerName,
            }).catch((err) => console.error('[Payment API] Failed to send receipt email:', err)),

            // Send email confirmation
            sendOrderConfirmation({
              to: customerEmail,
              orderNumber: `#${orderId}`,
              customerName,
            }).catch((err) => console.error('[Payment API] Failed to send confirmation email:', err)),

            // Send SMS confirmation (if phone provided and SMS configured)
            (async () => {
              const phone = body.customerPhone;
              if (phone && isSMSConfigured()) {
                try {
                  await sendOrderConfirmationSMS({
                    to: phone,
                    orderNumber: `#${orderId}`,
                    customerName,
                  });
                } catch (err) {
                  console.error('[Payment API] Failed to send SMS:', err);
                }
              }
            })(),
          ]).then(() => {
            console.log('[Payment API] Notifications sent successfully');
          }).catch((err) => {
            console.error('[Payment API] Some notifications failed:', err);
          });

          return NextResponse.json({
            success: true,
            paymentId: payment.id,
            status: payment.status,
            squareOrderId: squareOrderId,
          });
        } else {
          // Payment failed or in unexpected status
          const errorDetails = payment?.status
            ? `Payment status: ${payment.status}. Expected COMPLETED or APPROVED.`
            : "Payment status is missing";

          console.error("[Payment API] Payment not in expected status:", {
            status: payment?.status,
            payment: payment,
          });

          return NextResponse.json(
            {
              error: "Payment not completed",
              status: payment?.status,
              details: errorDetails,
              payment: payment,
            },
            { status: 400 }
          );
        }
      } catch (squareError: unknown) {
        console.error("[Payment API] Square payment error:", squareError);

        // Extract detailed error information
        let errorMessage = "Payment processing failed";
        let statusCode = 500;
        let errorDetails: any = null;

        if (squareError && typeof squareError === 'object') {
          const err = squareError as any;
          errorMessage = err.message || err.detail || errorMessage;
          statusCode = err.statusCode || err.status || statusCode;
          errorDetails = err.errors || null;
        } else if (squareError instanceof Error) {
          errorMessage = squareError.message;
        }

        console.error("[Payment API] Error details:", {
          message: errorMessage,
          statusCode,
          errors: errorDetails,
        });

        return NextResponse.json(
          {
            error: errorMessage,
            details: errorDetails,
            statusCode,
          },
          { status: statusCode }
        );
      }
    }

    // Demo mode - simulate payment success
    return NextResponse.json({
      success: true,
      paymentId: `demo_${randomUUID()}`,
      status: "COMPLETED",
      demo: true,
    });
  } catch (error) {
    console.error("Payment error:", error);
    return NextResponse.json(
      { error: "Payment processing failed" },
      { status: 500 }
    );
  }
}

