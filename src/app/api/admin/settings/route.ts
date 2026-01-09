import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/adminAuth";

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
          tagline: "Artisan Coffee & Cuisine",
          description: "Crafting exceptional coffee and culinary experiences since 2024.",
          address: "123 Coffee Street",
          phone: "(555) 123-4567",
          email: "hello@hooligans.com",
        },
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

export async function PUT(request: Request) {
  const authResult = await requireAdmin();
  if (!authResult.authorized) {
    return authResult.response;
  }

  try {
    const body = await request.json();
    const {
      cafe_name,
      tagline,
      description,
      address,
      phone,
      email,
      monday_hours,
      tuesday_hours,
      wednesday_hours,
      thursday_hours,
      friday_hours,
      saturday_hours,
      sunday_hours,
      facebook_url,
      instagram_url,
      twitter_url,
      tiktok_url,
    } = body;

    // Find or create settings
    let settings = await prisma.cafeSettings.findFirst();
    
    if (!settings) {
      settings = await prisma.cafeSettings.create({
        data: {
          cafe_name: cafe_name || "Hooligans",
        },
      });
    }

    settings = await prisma.cafeSettings.update({
      where: { id: settings.id },
      data: {
        cafe_name,
        tagline,
        description,
        address,
        phone,
        email,
        monday_hours,
        tuesday_hours,
        wednesday_hours,
        thursday_hours,
        friday_hours,
        saturday_hours,
        sunday_hours,
        facebook_url,
        instagram_url,
        twitter_url,
        tiktok_url,
      },
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error updating settings:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}

