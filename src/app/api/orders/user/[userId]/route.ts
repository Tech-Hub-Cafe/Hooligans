import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

interface Order {
  id: number;
  items: unknown;
  total: number;
  status: string;
  created_at: string;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await auth();
    const { userId } = await params;

    // Verify user is requesting their own orders
    if (!session?.user?.id || session.user.id !== userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const orders = await prisma.order.findMany({
      where: { user_id: parseInt(userId) },
      orderBy: { created_at: "desc" },
    });

    const formattedOrders = orders.map((order) => ({
      ...order,
      total: parseFloat(order.total.toString()),
      items: order.items as any,
    }));

    return NextResponse.json(formattedOrders);
  } catch (error) {
    console.error("Error fetching user orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

