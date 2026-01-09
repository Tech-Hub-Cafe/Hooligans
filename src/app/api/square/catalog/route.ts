import { NextResponse } from "next/server";
import { listCatalogItems, squareMoneyToDollars, isSquareConfigured } from "@/lib/square";

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  image_url: string | null;
  available: boolean;
  square_id: string;
}

// GET /api/square/catalog - Fetch menu items from Square POS API only
export async function GET() {
  try {
    // Check if Square is configured
    if (!isSquareConfigured()) {
      return NextResponse.json(
        {
          error: true,
          message: "Square POS is not configured",
          items: [],
          count: 0,
          source: "square",
        },
        { status: 503 }
      );
    }

    console.log("[Square Catalog API] Fetching from Square Catalog API...");

    try {
      const response = await listCatalogItems("ITEM");

      console.log("[Square Catalog API] Response:", {
        hasObjects: !!response.objects,
        objectCount: response.objects?.length || 0,
      });

      if (!response.objects || response.objects.length === 0) {
        return NextResponse.json({
          items: [],
          source: "square",
          count: 0,
          warning: "Square catalog returned no ITEM type objects",
          squareResponse: {
            hasObjects: false,
            objectCount: 0,
          },
        });
      }

      const items = response.objects.map((item: any, index: number) => {
        const variation = item.itemData?.variations?.[0];
        const hasPrice = !!variation?.itemVariationData?.priceMoney;

        if (!hasPrice) {
          console.warn(`[Square Catalog API] Item ${index + 1} (${item.itemData?.name || item.id}) missing price`);
        }

        return {
          id: item.id,
          name: item.itemData?.name || "Unknown",
          description: item.itemData?.description || null,
          price: hasPrice
            ? squareMoneyToDollars(variation.itemVariationData.priceMoney.amount)
            : 0,
          category: item.itemData?.categoryId || "Uncategorized",
          image_url: null,
          available: !item.isDeleted,
          square_id: item.id,
        };
      });

      return NextResponse.json({
        items,
        source: "square",
        count: items.length,
        success: true,
      });
    } catch (squareError: any) {
      console.error("[Square Catalog API] Error Details:", {
        message: squareError?.message,
        errors: squareError?.errors,
        statusCode: squareError?.statusCode || squareError?.status,
      });

      return NextResponse.json(
        {
          error: true,
          source: "square",
          message: squareError?.message || "Square API error",
          errors: squareError?.errors || [],
          statusCode: squareError?.statusCode || squareError?.status,
          items: [],
          count: 0,
        },
        { status: squareError?.statusCode || squareError?.status || 500 }
      );
    }
  } catch (error: any) {
    console.error("[Square Catalog API] Fatal Error:", {
      message: error?.message,
      stack: error?.stack,
    });

    return NextResponse.json(
      {
        error: true,
        message: "Failed to fetch catalog",
        details: error?.message || "Unknown error",
        items: [],
        count: 0,
      },
      { status: 500 }
    );
  }
}
