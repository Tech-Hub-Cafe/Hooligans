import { NextResponse } from "next/server";
import { getLocation } from "@/lib/square";

// GET /api/square/location - Get location details including country
export async function GET() {
  try {
    const locationId = process.env.SQUARE_LOCATION_ID;
    
    if (!locationId) {
      return NextResponse.json(
        { error: "Square location ID not configured" },
        { status: 400 }
      );
    }

    const location = await getLocation(locationId);
    
    if (!location) {
      return NextResponse.json(
        { error: "Location not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      location: {
        id: location.id,
        name: location.name,
        country: location.country,
        address: location.address,
      },
    });
  } catch (error: any) {
    console.error("[Location API] Error:", error);
    return NextResponse.json(
      { 
        error: "Failed to fetch location details",
        message: error.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}
