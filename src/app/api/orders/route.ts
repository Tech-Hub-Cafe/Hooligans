import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export interface OrderItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  items: OrderItem[];
  total: number;
  status: string;
  special_instructions: string | null;
  user_id: number | null;
  created_at: string;
}

// GET /api/orders - Get all orders
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const orders = await prisma.order.findMany({
      where: status ? { status } : undefined,
      orderBy: { created_at: "desc" },
    });

    // Convert total from Decimal to number
    const formattedOrders = orders.map((order) => ({
      ...order,
      total: parseFloat(order.total.toString()),
      items: order.items as OrderItem[],
    }));

    return NextResponse.json(formattedOrders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

// POST /api/orders - Create a new order
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      customer_name,
      customer_email,
      customer_phone,
      items,
      total,
      special_instructions,
      user_id,
    } = body;

    if (!customer_name || !customer_email || !items || !total) {
      return NextResponse.json(
        { error: "Customer name, email, items, and total are required" },
        { status: 400 }
      );
    }

    // Get user_id from session if not provided
    let finalUserId = user_id ? parseInt(user_id.toString()) : null;
    if (!finalUserId) {
      const session = await auth();
      finalUserId = session?.user?.id ? parseInt(session.user.id) : null;
    }

    const order = await prisma.order.create({
      data: {
        customer_name,
        customer_email,
        customer_phone: customer_phone || null,
        items: items as any,
        total: total.toString(),
        special_instructions: special_instructions || null,
        status: "pending",
        user_id: finalUserId,
      },
    });

    return NextResponse.json(
      {
        ...order,
        total: parseFloat(order.total.toString()),
        items: order.items as OrderItem[],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}

