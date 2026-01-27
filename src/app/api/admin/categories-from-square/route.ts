import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { prisma } from "@/lib/db";
import { searchCatalogObjects, isSquareConfigured } from "@/lib/square";
import {
  buildCategoryMap,
  normalizeItem,
  resolveCategoryNames,
  separateCatalogObjects,
} from "@/lib/squareCatalogParser";

// GET - Fetch unique categories from menu items (same as admin menu panel)
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
          error: "Square POS is not configured",
          categories: [],
        },
        { status: 503 }
      );
    }

    // Use the same logic as /api/admin/menu to get categories
    // Fetch all disabled items from database
    const disabledItems = await prisma.disabledMenuItem.findMany();
    const disabledSquareIds = new Set(disabledItems.map((item: { square_id: string | null }) => item.square_id));

    // Fetch items from Square (same logic as admin menu API)
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
        console.warn(`[Categories API] Reached max pages (100), stopping pagination`);
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
    
    // Process items to get their categories (same as admin menu)
    const items = catalogItems.map((item: CatalogObject) => {
      const normalized = normalizeItem(item, categoryMapObj, itemVariations);
      const categoryNames = resolveCategoryNames(normalized.categoryIds, categoryMapObj);
      const categoryName = categoryNames.length > 0 ? categoryNames[0] : "Uncategorized";
      
      // Check if item is disabled
      const isDisabled = item.id ? disabledSquareIds.has(item.id) : false;
      
      return {
        category: categoryName.trim(),
        available: !isDisabled,
      };
    });

    // Extract unique category names from menu items (same logic as admin menu page)
    const categorySet = new Set<string>();
    items.forEach((item: { category?: string }) => {
      if (item.category && item.category.trim()) {
        categorySet.add(item.category.trim());
      }
    });

    const categoriesList = Array.from(categorySet).sort();

    return NextResponse.json({
      categories: categoriesList,
      count: categoriesList.length,
    });
  } catch (error: any) {
    console.error("Error fetching categories from menu items:", error);
    return NextResponse.json(
      { error: "Failed to fetch categories from menu items", categories: [] },
      { status: 500 }
    );
  }
}
