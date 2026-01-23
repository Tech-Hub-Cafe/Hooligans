import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/adminAuth";

interface OrderWithUser {
  id: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  items: unknown;
  total: { toString(): string };
  status: string;
  special_instructions: string | null;
  user_id: number | null;
  square_payment_id: string | null;
  created_at: Date;
  updated_at: Date | null;
  user: {
    name: string | null;
    email: string;
  } | null;
}

export async function GET() {
  const authResult = await requireAdmin();
  if (!authResult.authorized) {
    return authResult.response;
  }

  try {
    const orders = await prisma.order.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: { created_at: "desc" },
    });

    return NextResponse.json(orders.map((order: OrderWithUser) => ({
      ...order,
      total: parseFloat(order.total.toString()),
      items: order.items as unknown as Array<{ id: number; name: string; price: number; quantity: number }>,
      user_name: order.user?.name || null,
      user_email: order.user?.email || null,
    })));
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

