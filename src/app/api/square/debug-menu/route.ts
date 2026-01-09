import { NextResponse } from "next/server";
import { catalogApi, isSquareConfigured } from "@/lib/square";

// GET /api/square/debug-menu - Debug endpoint to see raw Square response
export async function GET() {
  try {
    if (!isSquareConfigured()) {
      return NextResponse.json({
        error: "Square is not configured",
      }, { status: 503 });
    }

    console.log("[Debug Menu] Fetching raw catalog data from Square...");

    // Fetch first page
    const response = await catalogApi.list({ types: "ITEM" });
    
    // Log the entire response structure
    console.log("[Debug Menu] Raw Square response:", JSON.stringify(response, null, 2));
    
    // Try to access data in different ways
    const result = (response as any).result || response;
    const data = result.data || result.objects || [];
    const cursor = result.cursor || (response as any).cursor || null;
    
    return NextResponse.json({
      success: true,
      rawResponse: {
        hasResult: !!(response as any).result,
        hasData: !!(response as any).data,
        responseKeys: Object.keys(response || {}),
        resultKeys: result ? Object.keys(result) : [],
      },
      extracted: {
        itemCount: data.length,
        hasCursor: !!cursor,
        cursor: cursor?.substring(0, 50) || null,
        items: data.map((item: any) => ({
          id: item.id,
          name: item.itemData?.name || "Unknown",
          hasVariations: !!item.itemData?.variations,
          variationCount: item.itemData?.variations?.length || 0,
          isDeleted: item.isDeleted,
          type: item.type,
        })),
      },
      fullResponse: response,
    });
  } catch (error: any) {
    console.error("[Debug Menu] Error:", error);
    return NextResponse.json({
      error: true,
      message: error.message,
      stack: error.stack,
    }, { status: 500 });
  }
}
