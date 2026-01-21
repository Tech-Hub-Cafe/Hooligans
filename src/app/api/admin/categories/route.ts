import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/adminAuth";

// GET /api/admin/categories - Get all categories with their disabled status
export async function GET() {
  const authResult = await requireAdmin();
  if (!authResult.authorized) {
    return authResult.response;
  }

  try {
    // Fetch all disabled categories from database
    const disabledCategories = await prisma.disabledCategory.findMany();
    const disabledCategoryNames = new Set(disabledCategories.map(cat => cat.category_name));

    // Fetch categories from Square (we need to get them from the menu API)
    // For now, we'll return the disabled categories and let the frontend fetch categories separately
    return NextResponse.json({
      disabledCategories: Array.from(disabledCategoryNames),
    });
  } catch (error) {
    console.error("Error fetching disabled categories:", error);
    return NextResponse.json(
      { error: "Failed to fetch disabled categories" },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/categories - Toggle category visibility
export async function PATCH(request: Request) {
  const authResult = await requireAdmin();
  if (!authResult.authorized) {
    return authResult.response;
  }

  try {
    const { searchParams } = new URL(request.url);
    const categoryName = searchParams.get("category_name");
    const body = await request.json();
    const { available } = body;

    if (!categoryName) {
      return NextResponse.json(
        { error: "category_name is required" },
        { status: 400 }
      );
    }

    if (available) {
      // Enable category - remove from disabled list
      await prisma.disabledCategory.deleteMany({
        where: { category_name: categoryName },
      });
    } else {
      // Disable category - add to disabled list (upsert to avoid duplicates)
      await prisma.disabledCategory.upsert({
        where: { category_name: categoryName },
        update: {},
        create: {
          category_name: categoryName,
        },
      });
    }

    return NextResponse.json({ 
      success: true, 
      category_name: categoryName, 
      available 
    });
  } catch (error) {
    console.error("Error toggling category:", error);
    return NextResponse.json(
      { error: "Failed to toggle category" },
      { status: 500 }
    );
  }
}
