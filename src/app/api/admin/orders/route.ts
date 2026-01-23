import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { requireAdmin } from "@/lib/adminAuth";

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

    // Define the type for the order with user relation
    type OrderWithUser = Prisma.OrderGetPayload<{
      include: {
        user: {
          select: {
            name: true;
            email: true;
          };
        };
      };
    }>;

    return NextResponse.json(orders.map((order: OrderWithUser) => ({
      ...order,
      total: parseFloat(order.total.toString()),
      items: order.items as any,
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

