import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/adminAuth";

// GET /api/admin/ordering-time - Get current ordering hours
export async function GET() {
  const authResult = await requireAdmin();
  if (!authResult.authorized) {
    return authResult.response;
  }

  try {
    let settings = await prisma.cafeSettings.findFirst();

    if (!settings) {
      // Create default settings if none exist
      settings = await prisma.cafeSettings.create({
        data: {
          cafe_name: "Hooligans",
        },
      });
    }

    // Return both food and drinks ordering hours
    return NextResponse.json({
      monday_food_ordering_hours: settings.monday_food_ordering_hours,
      tuesday_food_ordering_hours: settings.tuesday_food_ordering_hours,
      wednesday_food_ordering_hours: settings.wednesday_food_ordering_hours,
      thursday_food_ordering_hours: settings.thursday_food_ordering_hours,
      friday_food_ordering_hours: settings.friday_food_ordering_hours,
      saturday_food_ordering_hours: settings.saturday_food_ordering_hours,
      sunday_food_ordering_hours: settings.sunday_food_ordering_hours,
      monday_drinks_ordering_hours: settings.monday_drinks_ordering_hours,
      tuesday_drinks_ordering_hours: settings.tuesday_drinks_ordering_hours,
      wednesday_drinks_ordering_hours: settings.wednesday_drinks_ordering_hours,
      thursday_drinks_ordering_hours: settings.thursday_drinks_ordering_hours,
      friday_drinks_ordering_hours: settings.friday_drinks_ordering_hours,
      saturday_drinks_ordering_hours: settings.saturday_drinks_ordering_hours,
      sunday_drinks_ordering_hours: settings.sunday_drinks_ordering_hours,
    });
  } catch (error) {
    console.error("Error fetching ordering hours:", error);
    return NextResponse.json(
      { error: "Failed to fetch ordering hours" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/ordering-time - Update ordering hours
export async function PUT(request: Request) {
  const authResult = await requireAdmin();
  if (!authResult.authorized) {
    return authResult.response;
  }

  try {
    const body = await request.json();
    console.log("[AdminOrderingTime API] Received data:", JSON.stringify(body, null, 2));
    
    const {
      monday_food_ordering_hours,
      tuesday_food_ordering_hours,
      wednesday_food_ordering_hours,
      thursday_food_ordering_hours,
      friday_food_ordering_hours,
      saturday_food_ordering_hours,
      sunday_food_ordering_hours,
      monday_drinks_ordering_hours,
      tuesday_drinks_ordering_hours,
      wednesday_drinks_ordering_hours,
      thursday_drinks_ordering_hours,
      friday_drinks_ordering_hours,
      saturday_drinks_ordering_hours,
      sunday_drinks_ordering_hours,
    } = body;

    // Helper to normalize values: empty string, undefined, or null becomes null, "Closed" stays as "Closed"
    const normalizeValue = (value: string | null | undefined): string | null => {
      if (value === null || value === undefined || value === "") {
        return null;
      }
      // Trim and check if it's effectively empty
      const trimmed = String(value).trim();
      return trimmed === "" ? null : trimmed;
    };

    // Find or create settings
    let settings = await prisma.cafeSettings.findFirst();

    if (!settings) {
      settings = await prisma.cafeSettings.create({
        data: {
          cafe_name: "Hooligans",
        },
      });
    }

    // Prepare update data
    const updateData = {
      monday_food_ordering_hours: normalizeValue(monday_food_ordering_hours),
      tuesday_food_ordering_hours: normalizeValue(tuesday_food_ordering_hours),
      wednesday_food_ordering_hours: normalizeValue(wednesday_food_ordering_hours),
      thursday_food_ordering_hours: normalizeValue(thursday_food_ordering_hours),
      friday_food_ordering_hours: normalizeValue(friday_food_ordering_hours),
      saturday_food_ordering_hours: normalizeValue(saturday_food_ordering_hours),
      sunday_food_ordering_hours: normalizeValue(sunday_food_ordering_hours),
      monday_drinks_ordering_hours: normalizeValue(monday_drinks_ordering_hours),
      tuesday_drinks_ordering_hours: normalizeValue(tuesday_drinks_ordering_hours),
      wednesday_drinks_ordering_hours: normalizeValue(wednesday_drinks_ordering_hours),
      thursday_drinks_ordering_hours: normalizeValue(thursday_drinks_ordering_hours),
      friday_drinks_ordering_hours: normalizeValue(friday_drinks_ordering_hours),
      saturday_drinks_ordering_hours: normalizeValue(saturday_drinks_ordering_hours),
      sunday_drinks_ordering_hours: normalizeValue(sunday_drinks_ordering_hours),
    };

    console.log("[AdminOrderingTime API] Updating with data:", JSON.stringify(updateData, null, 2));

    // Update ordering hours
    settings = await prisma.cafeSettings.update({
      where: { id: settings.id },
      data: updateData,
    });

    console.log("[AdminOrderingTime API] Successfully updated settings");

    return NextResponse.json({
      monday_food_ordering_hours: settings.monday_food_ordering_hours,
      tuesday_food_ordering_hours: settings.tuesday_food_ordering_hours,
      wednesday_food_ordering_hours: settings.wednesday_food_ordering_hours,
      thursday_food_ordering_hours: settings.thursday_food_ordering_hours,
      friday_food_ordering_hours: settings.friday_food_ordering_hours,
      saturday_food_ordering_hours: settings.saturday_food_ordering_hours,
      sunday_food_ordering_hours: settings.sunday_food_ordering_hours,
      monday_drinks_ordering_hours: settings.monday_drinks_ordering_hours,
      tuesday_drinks_ordering_hours: settings.tuesday_drinks_ordering_hours,
      wednesday_drinks_ordering_hours: settings.wednesday_drinks_ordering_hours,
      thursday_drinks_ordering_hours: settings.thursday_drinks_ordering_hours,
      friday_drinks_ordering_hours: settings.friday_drinks_ordering_hours,
      saturday_drinks_ordering_hours: settings.saturday_drinks_ordering_hours,
      sunday_drinks_ordering_hours: settings.sunday_drinks_ordering_hours,
    });
  } catch (error) {
    console.error("Error updating ordering hours:", error);
    return NextResponse.json(
      { error: "Failed to update ordering hours" },
      { status: 500 }
    );
  }
}
