import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/adminAuth";

export async function GET() {
  const authResult = await requireAdmin();
  if (!authResult.authorized) {
    return authResult.response;
  }

  try {
    const menuItems = await prisma.menuItem.findMany({
      orderBy: [{ category: "asc" }, { name: "asc" }],
    });
    return NextResponse.json(menuItems.map(item => ({
      ...item,
      price: parseFloat(item.price.toString()),
    })));
  } catch (error) {
    console.error("Error fetching menu items:", error);
    return NextResponse.json(
      { error: "Failed to fetch menu items" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const authResult = await requireAdmin();
  if (!authResult.authorized) {
    return authResult.response;
  }

  try {
    const body = await request.json();
    const { name, description, price, category, image_url, available } = body;

    const item = await prisma.menuItem.create({
      data: {
        name,
        description: description || null,
        price: price.toString(),
        category,
        image_url: image_url || null,
        available: available ?? true,
      },
    });

    return NextResponse.json({
      ...item,
      price: parseFloat(item.price.toString()),
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating menu item:", error);
    return NextResponse.json(
      { error: "Failed to create menu item" },
      { status: 500 }
    );
  }
}

