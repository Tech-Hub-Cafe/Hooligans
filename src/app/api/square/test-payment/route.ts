import { NextResponse } from "next/server";
import { createPayment, dollarsToSquareMoney } from "@/lib/square";
import { randomUUID } from "crypto";

// POST /api/square/test-payment - Test payment creation with Square
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sourceId, amount } = body;

    if (!sourceId) {
      return NextResponse.json(
        { error: "sourceId (payment token) is required" },
        { status: 400 }
      );
    }

    if (!process.env.SQUARE_ACCESS_TOKEN || !process.env.SQUARE_LOCATION_ID) {
      return NextResponse.json(
        { error: "Square is not configured" },
        { status: 400 }
      );
    }

    const testAmount = amount || 1.00; // Default to $1.00 AUD for testing

    console.log("[Test Payment] Attempting test payment:", {
      sourceId: sourceId.substring(0, 30) + "...",
      amount: testAmount,
      currency: "AUD",
      locationId: process.env.SQUARE_LOCATION_ID.substring(0, 10) + "...",
    });

    try {
      const paymentResponse = await createPayment({
        sourceId,
        idempotencyKey: randomUUID(),
        amountMoney: {
          amount: dollarsToSquareMoney(testAmount),
          currency: "AUD",
        },
        locationId: process.env.SQUARE_LOCATION_ID!,
        buyerEmailAddress: "test@example.com",
        note: "Test payment from diagnostic endpoint",
      });

      const payment = paymentResponse.payment;

      return NextResponse.json({
        success: true,
        payment: {
          id: payment?.id,
          status: payment?.status,
          amountMoney: payment?.amountMoney,
          receiptNumber: payment?.receiptNumber,
          receiptUrl: payment?.receiptUrl,
          createdAt: payment?.createdAt,
        },
        message: "Test payment created successfully",
      });
    } catch (error: any) {
      console.error("[Test Payment] Payment creation failed:", error);

      return NextResponse.json(
        {
          success: false,
          error: error.message || "Payment creation failed",
          statusCode: error.statusCode || error.status || 500,
          errors: error.errors || [],
          detail: error.detail || error.message,
          fullError: error,
        },
        { status: error.statusCode || error.status || 500 }
      );
    }
  } catch (error: any) {
    console.error("[Test Payment] Fatal error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Test payment endpoint failed",
        message: error.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}
