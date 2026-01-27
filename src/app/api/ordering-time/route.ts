import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { checkOrderingAvailabilityByType } from "@/lib/orderingTime";

// GET /api/ordering-time - Public endpoint to check ordering availability
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const itemType = searchParams.get("type") as "food" | "drinks" | null;

    const settings = await prisma.cafeSettings.findFirst();

    if (!settings) {
      // No settings found, default to allowing orders
      return NextResponse.json({
        hours: {
          food: {
            monday_food_ordering_hours: null,
            tuesday_food_ordering_hours: null,
            wednesday_food_ordering_hours: null,
            thursday_food_ordering_hours: null,
            friday_food_ordering_hours: null,
            saturday_food_ordering_hours: null,
            sunday_food_ordering_hours: null,
          },
          drinks: {
            monday_drinks_ordering_hours: null,
            tuesday_drinks_ordering_hours: null,
            wednesday_drinks_ordering_hours: null,
            thursday_drinks_ordering_hours: null,
            friday_drinks_ordering_hours: null,
            saturday_drinks_ordering_hours: null,
            sunday_drinks_ordering_hours: null,
          },
        },
        isOrderingAvailable: true,
        message: "Ordering is available.",
      });
    }

    const orderingHours = {
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
      monday_combo_ordering_hours: settings.monday_combo_ordering_hours,
      tuesday_combo_ordering_hours: settings.tuesday_combo_ordering_hours,
      wednesday_combo_ordering_hours: settings.wednesday_combo_ordering_hours,
      thursday_combo_ordering_hours: settings.thursday_combo_ordering_hours,
      friday_combo_ordering_hours: settings.friday_combo_ordering_hours,
      saturday_combo_ordering_hours: settings.saturday_combo_ordering_hours,
      sunday_combo_ordering_hours: settings.sunday_combo_ordering_hours,
    };

    const timezone = settings.timezone || "Australia/Sydney";

    // If specific type requested, return only that type's availability
    if (itemType === "food" || itemType === "drinks") {
      const availability = checkOrderingAvailabilityByType(orderingHours, itemType, timezone);
      return NextResponse.json({
        hours: {
          food: {
            monday_food_ordering_hours: orderingHours.monday_food_ordering_hours,
            tuesday_food_ordering_hours: orderingHours.tuesday_food_ordering_hours,
            wednesday_food_ordering_hours: orderingHours.wednesday_food_ordering_hours,
            thursday_food_ordering_hours: orderingHours.thursday_food_ordering_hours,
            friday_food_ordering_hours: orderingHours.friday_food_ordering_hours,
            saturday_food_ordering_hours: orderingHours.saturday_food_ordering_hours,
            sunday_food_ordering_hours: orderingHours.sunday_food_ordering_hours,
          },
          drinks: {
            monday_drinks_ordering_hours: orderingHours.monday_drinks_ordering_hours,
            tuesday_drinks_ordering_hours: orderingHours.tuesday_drinks_ordering_hours,
            wednesday_drinks_ordering_hours: orderingHours.wednesday_drinks_ordering_hours,
            thursday_drinks_ordering_hours: orderingHours.thursday_drinks_ordering_hours,
            friday_drinks_ordering_hours: orderingHours.friday_drinks_ordering_hours,
            saturday_drinks_ordering_hours: orderingHours.saturday_drinks_ordering_hours,
            sunday_drinks_ordering_hours: orderingHours.sunday_drinks_ordering_hours,
          },
        },
        isOrderingAvailable: availability.isAvailable,
        message: availability.message,
        currentDayHours: availability.currentDayHours,
        itemType,
        timezone,
      });
    }

    // Return both food and drinks availability
    const foodAvailability = checkOrderingAvailabilityByType(orderingHours, "food", timezone);
    const drinksAvailability = checkOrderingAvailabilityByType(orderingHours, "drinks", timezone);

    return NextResponse.json({
      hours: {
        food: {
          monday_food_ordering_hours: orderingHours.monday_food_ordering_hours,
          tuesday_food_ordering_hours: orderingHours.tuesday_food_ordering_hours,
          wednesday_food_ordering_hours: orderingHours.wednesday_food_ordering_hours,
          thursday_food_ordering_hours: orderingHours.thursday_food_ordering_hours,
          friday_food_ordering_hours: orderingHours.friday_food_ordering_hours,
          saturday_food_ordering_hours: orderingHours.saturday_food_ordering_hours,
          sunday_food_ordering_hours: orderingHours.sunday_food_ordering_hours,
        },
        drinks: {
          monday_drinks_ordering_hours: orderingHours.monday_drinks_ordering_hours,
          tuesday_drinks_ordering_hours: orderingHours.tuesday_drinks_ordering_hours,
          wednesday_drinks_ordering_hours: orderingHours.wednesday_drinks_ordering_hours,
          thursday_drinks_ordering_hours: orderingHours.thursday_drinks_ordering_hours,
          friday_drinks_ordering_hours: orderingHours.friday_drinks_ordering_hours,
          saturday_drinks_ordering_hours: orderingHours.saturday_drinks_ordering_hours,
          sunday_drinks_ordering_hours: orderingHours.sunday_drinks_ordering_hours,
        },
      },
      food: {
        isOrderingAvailable: foodAvailability.isAvailable,
        message: foodAvailability.message,
        currentDayHours: foodAvailability.currentDayHours,
      },
      drinks: {
        isOrderingAvailable: drinksAvailability.isAvailable,
        message: drinksAvailability.message,
        currentDayHours: drinksAvailability.currentDayHours,
      },
      timezone,
    });
  } catch (error) {
    console.error("Error checking ordering availability:", error);
    // On error, default to allowing orders (fail open)
    return NextResponse.json({
      hours: { food: {}, drinks: {} },
      isOrderingAvailable: true,
      message: "Ordering is available.",
    });
  }
}
