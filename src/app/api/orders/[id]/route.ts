import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

interface OrderItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
}

interface Order {
  id: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  items: OrderItem[];
  total: number;
  status: string;
  special_instructions: string | null;
  created_at: string;
}

// GET /api/orders/[id] - Get a single order
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const order = await prisma.order.findUnique({
      where: { id: parseInt(id) },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...order,
      total: parseFloat(order.total.toString()),
      items: order.items as unknown as OrderItem[],
    });
  } catch (error) {
    console.error("Error fetching order:", error);
    return NextResponse.json(
      { error: "Failed to fetch order" },
      { status: 500 }
    );
  }
}

// PUT /api/orders/[id] - Update an order (mainly for status updates)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, special_instructions } = body;

    const validStatuses = ["pending", "preparing", "ready", "completed", "cancelled"];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Invalid status value" },
        { status: 400 }
      );
    }

    const order = await prisma.order.update({
      where: { id: parseInt(id) },
      data: {
        ...(status && { status }),
        ...(special_instructions !== undefined && { special_instructions }),
      },
    });

    return NextResponse.json({
      ...order,
      total: parseFloat(order.total.toString()),
      items: order.items as unknown as OrderItem[],
    });
  } catch (error) {
    console.error("Error updating order:", error);
    return NextResponse.json(
      { error: "Failed to update order" },
      { status: 500 }
    );
  }
}

// DELETE /api/orders/[id] - Delete an order
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.order.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ message: "Order deleted successfully" });
  } catch (error: any) {
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }
    console.error("Error deleting order:", error);
    return NextResponse.json(
      { error: "Failed to delete order" },
      { status: 500 }
    );
  }
}

