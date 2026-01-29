import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Public endpoint to get cafe settings (no auth required)
export async function GET() {
  try {
    const settings = await prisma.cafeSettings.findFirst();
    
    if (!settings) {
      // Return default settings
      return NextResponse.json({
        cafe_name: "Hooligans",
        tagline: "Artisan Coffee & Cuisine",
        description: "Crafting exceptional coffee and culinary experiences since 2026.",
        address: "123 Coffee Street",
        phone: "(555) 123-4567",
        email: "hello@hooligans.com",
        monday_hours: "7am - 8pm",
        tuesday_hours: "7am - 8pm",
        wednesday_hours: "7am - 8pm",
        thursday_hours: "7am - 8pm",
        friday_hours: "7am - 8pm",
        saturday_hours: "8am - 9pm",
        sunday_hours: "8am - 9pm",
        facebook_url: null,
        instagram_url: null,
        twitter_url: null,
        tiktok_url: null,
      });
    }
    
    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

