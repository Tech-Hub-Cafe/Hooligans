import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/adminAuth";
import { listCatalogItems, searchCatalogObjects, squareMoneyToDollars, isSquareConfigured } from "@/lib/square";
import {
  buildCategoryMap,
  normalizeItem,
  resolveCategoryNames,
  separateCatalogObjects,
} from "@/lib/squareCatalogParser";

// GET /api/admin/menu - Get all menu items from Square (same as public API, but includes disabled status)
export async function GET() {
  const authResult = await requireAdmin();
  if (!authResult.authorized) {
    return authResult.response;
  }

  try {
    // Check if Square is configured
    if (!isSquareConfigured()) {
      return NextResponse.json(
        {
          error: true,
          message: "Square POS is not configured",
          items: [],
          count: 0,
        },
        { status: 503 }
      );
    }

    // Fetch all disabled items from database
    const disabledItems = await prisma.disabledMenuItem.findMany();
    const disabledSquareIds = new Set(disabledItems.map((item: { square_id: string | null }) => item.square_id));

    // Fetch items from Square (same logic as public menu API)
    interface CatalogObject {
      type?: string;
      id?: string;
      itemData?: {
        variations?: Array<{
          id?: string;
          itemVariationData?: {
            priceMoney?: {
              amount?: number | bigint;
            };
            [key: string]: unknown;
          };
          [key: string]: unknown;
        }>;
        [key: string]: unknown;
      };
      [key: string]: unknown;
    }
    const allCatalogObjects: CatalogObject[] = [];
    let cursor: string | null = null;
    let pageCount = 0;
    
    do {
      pageCount++;
      if (pageCount > 100) {
        console.warn(`[Admin Menu API] Reached max pages (100), stopping pagination`);
        break;
      }
      
      const response = await searchCatalogObjects(
        ["ITEM", "CATEGORY", "ITEM_VARIATION"], 
        cursor || undefined, 
        true
      );
      
      if (response.objects && response.objects.length > 0) {
        allCatalogObjects.push(...response.objects);
      }
      
      cursor = response.cursor || null;
    } while (cursor);

    // Separate objects by type
    const { items: catalogItems, categories, itemVariations } = separateCatalogObjects(allCatalogObjects);
    
    // Build category map
    const categoryMapObj = buildCategoryMap(categories);
    
    // Process items
    const items = catalogItems.map((item: CatalogObject) => {
      const variation = item.itemData?.variations?.[0];
      const normalized = normalizeItem(item, categoryMapObj, itemVariations);
      const categoryNames = resolveCategoryNames(normalized.categoryIds, categoryMapObj);
      const categoryName = categoryNames.length > 0 ? categoryNames[0] : "Uncategorized";
      
      // Check if item is disabled
      const isDisabled = item.id ? disabledSquareIds.has(item.id) : false;
      
      // Get price
      let price = 0;
      if (variation && typeof variation === 'object' && 'itemVariationData' in variation) {
        const variationData = variation as { itemVariationData?: { priceMoney?: { amount?: number | bigint } } };
        if (variationData.itemVariationData?.priceMoney?.amount) {
          const amount = variationData.itemVariationData.priceMoney.amount;
          price = typeof amount === 'bigint' 
            ? Number(amount) / 100 
            : squareMoneyToDollars(amount as number);
        }
      }

      // Get image
      let imageUrl: string | null = null;
      const itemImageIds = Array.isArray(item.itemData?.imageIds) ? item.itemData.imageIds : [];
      const variationImageIds = variation && typeof variation === 'object' && 'itemVariationData' in variation
        ? (Array.isArray((variation as { itemVariationData?: { imageIds?: unknown[] } }).itemVariationData?.imageIds)
          ? (variation as { itemVariationData: { imageIds: string[] } }).itemVariationData.imageIds
          : [])
        : [];
      const imageIds = itemImageIds.length > 0 ? itemImageIds : variationImageIds;
      if (imageIds.length > 0) {
        // For simplicity, we'll just note that images exist
        // Full image fetching would require another API call
        imageUrl = null; // Could fetch images separately if needed
      }

      return {
        id: item.id,
        name: item.itemData?.name || "Unknown",
        description: item.itemData?.description || null,
        price: price,
        category: categoryName.trim(),
        image_url: imageUrl,
        available: !isDisabled, // Available = not disabled
        square_id: item.id,
        isDisabled: isDisabled,
      };
    });

    return NextResponse.json(items);
  } catch (error) {
    console.error("Error fetching menu items:", error);
    return NextResponse.json(
      { error: "Failed to fetch menu items" },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/menu/[id] - Toggle item availability
export async function PATCH(request: Request) {
  const authResult = await requireAdmin();
  if (!authResult.authorized) {
    return authResult.response;
  }

  try {
    const { searchParams } = new URL(request.url);
    const squareId = searchParams.get("square_id");
    const body = await request.json();
    const { available } = body;

    if (!squareId) {
      return NextResponse.json(
        { error: "square_id is required" },
        { status: 400 }
      );
    }

    if (available) {
      // Enable item - remove from disabled list
      await prisma.disabledMenuItem.deleteMany({
        where: { square_id: squareId },
      });
    } else {
      // Disable item - add to disabled list (upsert to avoid duplicates)
      await prisma.disabledMenuItem.upsert({
        where: { square_id: squareId },
        update: {},
        create: {
          square_id: squareId,
        },
      });
    }

    return NextResponse.json({ 
      success: true, 
      square_id: squareId, 
      available 
    });
  } catch (error) {
    console.error("Error toggling menu item:", error);
    return NextResponse.json(
      { error: "Failed to toggle menu item" },
      { status: 500 }
    );
  }
}
