import { NextResponse } from "next/server";
import { createPayment, dollarsToSquareMoney } from "@/lib/square";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { randomUUID } from "crypto";

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
        const paymentResponse = await createPayment({
          sourceId,
          idempotencyKey: randomUUID(),
          amountMoney: {
            amount: dollarsToSquareMoney(amount),
            currency: "AUD", // Australia uses AUD, not USD
          },
          locationId: process.env.SQUARE_LOCATION_ID!,
          buyerEmailAddress: customerEmail,
          note: `Order for ${customerName}`,
        });

        const payment = paymentResponse.payment;
        if (payment?.status === "COMPLETED") {
          // Update order status in database
          if (orderId) {
            await prisma.order.update({
              where: { id: orderId },
              data: {
                status: "paid",
                square_payment_id: payment.id,
              },
            });
          }

          return NextResponse.json({
            success: true,
            paymentId: payment.id,
            status: payment.status,
          });
        } else {
          return NextResponse.json(
            { error: "Payment not completed", status: payment?.status },
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

