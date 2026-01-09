import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/adminAuth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdmin();
  if (!authResult.authorized) {
    return authResult.response;
  }

  const { id } = await params;

  try {
    const item = await prisma.menuItem.findUnique({
      where: { id: parseInt(id) },
    });

    if (!item) {
      return NextResponse.json({ error: "Menu item not found" }, { status: 404 });
    }

    return NextResponse.json({
      ...item,
      price: parseFloat(item.price.toString()),
    });
  } catch (error) {
    console.error("Error fetching menu item:", error);
    return NextResponse.json(
      { error: "Failed to fetch menu item" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdmin();
  if (!authResult.authorized) {
    return authResult.response;
  }

  const { id } = await params;
  const body = await request.json();
  const { name, description, price, category, image_url, available } = body;

  try {
    const item = await prisma.menuItem.update({
      where: { id: parseInt(id) },
      data: {
        name,
        description: description || null,
        price: price.toString(),
        category,
        image_url: image_url || null,
        available,
      },
    });

    return NextResponse.json({
      ...item,
      price: parseFloat(item.price.toString()),
    });
  } catch (error) {
    console.error("Error updating menu item:", error);
    return NextResponse.json(
      { error: "Failed to update menu item" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdmin();
  if (!authResult.authorized) {
    return authResult.response;
  }

  const { id } = await params;

  try {
    await prisma.menuItem.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting menu item:", error);
    return NextResponse.json(
      { error: "Failed to delete menu item" },
      { status: 500 }
    );
  }
}

