import { NextResponse } from "next/server";
import { listCatalogItems, squareMoneyToDollars, isSquareConfigured } from "@/lib/square";

export interface Modifier {
  id: string;
  name: string;
  price: number;
  square_id: string;
}

export interface ModifierList {
  id: string;
  name: string;
  selectionType: "SINGLE" | "MULTIPLE";
  modifiers: Modifier[];
  square_id: string;
  required?: boolean; // Whether at least one modifier must be selected
}

export interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  image_url: string | null;
  available: boolean;
  square_id: string;
  modifierLists?: ModifierList[];
}

// GET /api/menu - Get all menu items from Square POS API only
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");

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

    console.log("[Menu API] Fetching menu items and categories from Square Catalog API...");

    try {
      // Helper function to fetch all pages for a given type
      const fetchAllPages = async (type: string) => {
        const allObjects: any[] = [];
        let cursor: string | null = null;
        let pageCount = 0;
        
        do {
          pageCount++;
          if (pageCount > 100) {
            console.warn(`[Menu API] Reached max pages (100) for ${type}, stopping pagination`);
            break;
          }
          
          const response = await listCatalogItems(type, cursor || undefined);
          if (response.objects && response.objects.length > 0) {
            allObjects.push(...response.objects);
            console.log(`[Menu API] Page ${pageCount} for ${type}: ${response.objects.length} items (total: ${allObjects.length})`);
          } else {
            console.log(`[Menu API] Page ${pageCount} for ${type}: No items returned`);
          }
          
          cursor = response.cursor || null;
          if (cursor) {
            console.log(`[Menu API] Page ${pageCount} for ${type}: Has cursor, fetching next page...`);
          } else {
            console.log(`[Menu API] Page ${pageCount} for ${type}: No cursor, pagination complete`);
          }
        } while (cursor);
        
        console.log(`[Menu API] ✅ Finished fetching ${type}: ${allObjects.length} total items across ${pageCount} page(s)`);
        return { objects: allObjects };
      };

      // Fetch all pages for each type
      const [itemsResponse, categoriesResponse, modifierListsResponse, modifiersResponse, imagesResponse] = await Promise.all([
        fetchAllPages("ITEM"),
        fetchAllPages("CATEGORY").catch(() => ({ objects: [] })), // Categories are optional
        fetchAllPages("MODIFIER_LIST").catch(() => ({ objects: [] })), // Modifier lists are optional
        fetchAllPages("MODIFIER").catch(() => ({ objects: [] })), // Modifiers are optional
        fetchAllPages("IMAGE").catch(() => ({ objects: [] })), // Images are optional
      ]);

      console.log("[Menu API] Square API Response (all pages fetched):", {
        hasItems: !!itemsResponse.objects,
        itemCount: itemsResponse.objects?.length || 0,
        hasCategories: !!categoriesResponse.objects,
        categoryCount: categoriesResponse.objects?.length || 0,
        hasModifierLists: !!modifierListsResponse.objects,
        modifierListCount: modifierListsResponse.objects?.length || 0,
        hasModifiers: !!modifiersResponse.objects,
        modifierCount: modifiersResponse.objects?.length || 0,
        hasImages: !!imagesResponse.objects,
        imageCount: imagesResponse.objects?.length || 0,
      });

      // Build category map: categoryId -> categoryName (normalized)
      const categoryMap = new Map<string, string>();
      if (categoriesResponse.objects && categoriesResponse.objects.length > 0) {
        console.log("[Menu API] Processing categories from Square:", {
          categoryCount: categoriesResponse.objects.length,
        });
        categoriesResponse.objects.forEach((cat: any) => {
          if (cat.categoryData?.name) {
            // Normalize category name: trim whitespace, but preserve original casing
            const categoryName = cat.categoryData.name.trim();
            categoryMap.set(cat.id, categoryName);
            console.log(`[Menu API] Mapped category: ${cat.id} -> "${categoryName}"`);
          } else {
            console.warn(`[Menu API] Category ${cat.id} has no name in categoryData:`, JSON.stringify(cat, null, 2));
          }
        });
        console.log(`[Menu API] Category map contains ${categoryMap.size} categories:`, Array.from(categoryMap.entries()).map(([id, name]) => `${id} -> "${name}"`));
      } else {
        console.log("[Menu API] No categories found in Square catalog");
      }

      // Build modifier map: modifierId -> modifier
      const modifierMap = new Map<string, Modifier>();
      if (modifiersResponse.objects && modifiersResponse.objects.length > 0) {
        console.log("[Menu API] Processing modifiers from Square:", {
          modifierCount: modifiersResponse.objects.length,
        });
        modifiersResponse.objects.forEach((mod: any) => {
          // Square API can return modifiers in different structures
          const modifierData = mod.modifierData || mod;
          if (modifierData?.name) {
            const modifierPrice = modifierData?.priceMoney
              ? squareMoneyToDollars(modifierData.priceMoney.amount)
              : 0;
            const modifierId = mod.id || modifierData.id;
            modifierMap.set(modifierId, {
              id: modifierId,
              name: modifierData.name,
              price: modifierPrice,
              square_id: modifierId,
            });
            console.log(`[Menu API] Mapped modifier: ${modifierId} -> ${modifierData.name} ($${modifierPrice.toFixed(2)})`);
          } else {
            console.warn(`[Menu API] Modifier ${mod.id} has no name in modifierData:`, JSON.stringify(mod, null, 2));
          }
        });
      } else {
        console.log("[Menu API] No separate MODIFIER objects found - checking if embedded in modifier lists");
      }

      // Build image map: imageId -> imageUrl
      const imageMap = new Map<string, string>();
      if (imagesResponse.objects && imagesResponse.objects.length > 0) {
        console.log("[Menu API] Processing images from Square:", {
          imageCount: imagesResponse.objects.length,
        });
        imagesResponse.objects.forEach((img: any) => {
          // Square images can be in imageData.url or imageData
          const imageUrl = img.imageData?.url || img.url;
          if (imageUrl) {
            imageMap.set(img.id, imageUrl);
            console.log(`[Menu API] Mapped image: ${img.id} -> ${imageUrl.substring(0, 50)}...`);
          }
        });
      } else {
        console.log("[Menu API] No IMAGE objects found in Square catalog");
      }

      // Build modifier list map: modifierListId -> modifierList
      const modifierListMap = new Map<string, ModifierList>();
      if (modifierListsResponse.objects && modifierListsResponse.objects.length > 0) {
        console.log("[Menu API] Processing modifier lists from Square:", {
          modifierListCount: modifierListsResponse.objects.length,
        });
        modifierListsResponse.objects.forEach((modList: any) => {
          if (modList.modifierListData?.name) {
            // Square API can have modifiers in different structures:
            // 1. modList.modifierListData.modifiers (array of {modifierId: string})
            // 2. modList.modifierListData.modifiers (array of modifier objects directly)
            // 3. Embedded modifier data in the modifier list
            let modifierIds: string[] = [];
            
            if (modList.modifierListData?.modifiers) {
              modifierIds = modList.modifierListData.modifiers.map((m: any) => {
                // Could be {modifierId: "..."} or just the ID string, or full object
                return m.modifierId || m.id || m;
              });
            }
            
            // Try to get modifiers from the map
            let modifiers = modifierIds
              .map((id: string) => modifierMap.get(id))
              .filter((m): m is Modifier => m !== undefined);
            
            // If no modifiers found via IDs, check if modifiers are embedded directly
            if (modifiers.length === 0 && modList.modifierListData?.modifiers) {
              modifiers = modList.modifierListData.modifiers
                .filter((m: any) => m.modifierData || m.name) // Has modifier data
                .map((m: any) => {
                  // Extract from embedded modifier object
                  const modifierData = m.modifierData || m;
                  if (modifierData.name) {
                    const modifierPrice = modifierData.priceMoney
                      ? squareMoneyToDollars(modifierData.priceMoney.amount)
                      : 0;
                    return {
                      id: m.id || modifierData.id || m.modifierId,
                      name: modifierData.name,
                      price: modifierPrice,
                      square_id: m.id || modifierData.id || m.modifierId,
                    };
                  }
                  return null;
                })
                .filter((m): m is Modifier => m !== null);
            }

            console.log(`[Menu API] Modifier list "${modList.modifierListData.name}":`, {
              modifierIdsFound: modifierIds.length,
              modifiersFromMap: modifierIds.filter(id => modifierMap.has(id)).length,
              modifiersEmbedded: modifiers.length,
              modifierIds: modifierIds,
            });

            modifierListMap.set(modList.id, {
              id: modList.id,
              name: modList.modifierListData.name,
              selectionType: modList.modifierListData.selectionType || "SINGLE",
              modifiers: modifiers,
              square_id: modList.id,
              required: false, // Will be set based on item's modifierListInfo
            });
          }
        });
      }

      if (!itemsResponse.objects || itemsResponse.objects.length === 0) {
        return NextResponse.json({
          items: [],
          categories: Array.from(categoryMap.values()),
          source: "square",
          count: 0,
          warning: "Square catalog is empty or has no ITEM type objects",
        });
      }

      console.log(`[Menu API] Processing ${itemsResponse.objects.length} items from Square...`);
      
      let items = itemsResponse.objects.map((item: any, index: number) => {
        const itemName = item.itemData?.name || item.id || "Unknown";
        const variation = item.itemData?.variations?.[0];
        const hasPrice = !!variation?.itemVariationData?.priceMoney;
        const hasVariations = !!item.itemData?.variations && item.itemData.variations.length > 0;

        console.log(`[Menu API] Processing item ${index + 1}/${itemsResponse.objects.length}: "${itemName}"`, {
          id: item.id,
          hasVariations,
          variationCount: item.itemData?.variations?.length || 0,
          hasPrice,
          isDeleted: item.isDeleted,
        });

        if (!hasVariations) {
          console.warn(`[Menu API] ⚠️ Item "${itemName}" (${item.id}) has NO variations - it may not display correctly`);
        }

        if (!hasPrice) {
          console.warn(`[Menu API] ⚠️ Item "${itemName}" (${item.id}) has no price variation - will show as $0.00`);
        }

        // Get category name from map, or use categoryId if not found
        const categoryId = item.itemData?.categoryId;
        let categoryName: string;
        
        if (categoryId && categoryMap.has(categoryId)) {
          categoryName = categoryMap.get(categoryId)!;
          console.log(`[Menu API] Item "${itemName}" assigned to category "${categoryName}" (ID: ${categoryId})`);
        } else if (categoryId) {
          // Category ID exists but not in map - log warning
          console.warn(`[Menu API] ⚠️ Item "${itemName}" has categoryId "${categoryId}" but category not found in map. Available categories:`, Array.from(categoryMap.keys()));
          categoryName = "Uncategorized";
        } else {
          categoryName = "Uncategorized";
          console.log(`[Menu API] Item "${itemName}" has no categoryId - assigned to "Uncategorized"`);
        }

        // Get modifier lists for this item
        // Square API can have modifier lists in different places:
        // 1. item.itemData.modifierListInfo.modifierLists (array of {modifierListId, enabled: boolean})
        // 2. item.itemData.modifierListInfo (array directly)
        // 3. item.itemData.modifierLists (direct array)
        let modifierListIds: string[] = [];
        const modifierListInfoMap = new Map<string, { enabled?: boolean; minSelected?: number; maxSelected?: number }>();
        
        if (item.itemData?.modifierListInfo?.modifierLists) {
          item.itemData.modifierListInfo.modifierLists.forEach((ml: any) => {
            const id = ml.modifierListId || ml.id || ml;
            modifierListIds.push(id);
            modifierListInfoMap.set(id, {
              enabled: ml.enabled !== false, // Default to enabled if not specified
              minSelected: ml.minSelectedModifiers,
              maxSelected: ml.maxSelectedModifiers,
            });
          });
        } else if (Array.isArray(item.itemData?.modifierListInfo)) {
          item.itemData.modifierListInfo.forEach((ml: any) => {
            const id = ml.modifierListId || ml.id || ml;
            modifierListIds.push(id);
            modifierListInfoMap.set(id, {
              enabled: ml.enabled !== false,
              minSelected: ml.minSelectedModifiers,
              maxSelected: ml.maxSelectedModifiers,
            });
          });
        } else if (item.itemData?.modifierLists) {
          item.itemData.modifierLists.forEach((ml: any) => {
            const id = ml.modifierListId || ml.id || ml;
            modifierListIds.push(id);
            modifierListInfoMap.set(id, {
              enabled: ml.enabled !== false,
              minSelected: ml.minSelectedModifiers,
              maxSelected: ml.maxSelectedModifiers,
            });
          });
        }
        
        const modifierLists = modifierListIds
          .map((id: string) => {
            const modifierList = modifierListMap.get(id);
            if (modifierList) {
              const info = modifierListInfoMap.get(id);
              // A modifier list is required if minSelectedModifiers > 0 or if it's enabled and has a minimum
              return {
                ...modifierList,
                required: (info?.minSelected || 0) > 0 || (info?.enabled && modifierList.selectionType === "SINGLE"),
              };
            }
            return undefined;
          })
          .filter((ml): ml is ModifierList => ml !== undefined);

        // Get image URL for this item
        // Square items can have images in:
        // 1. item.itemData.imageIds (array of image IDs)
        // 2. variation.itemVariationData.imageIds (array of image IDs)
        let imageUrl: string | null = null;
        const imageIds = item.itemData?.imageIds || variation?.itemVariationData?.imageIds || [];
        if (imageIds.length > 0) {
          // Get the first image
          const firstImageId = imageIds[0];
          imageUrl = imageMap.get(firstImageId) || null;
          if (imageUrl) {
            console.log(`[Menu API] Item "${item.itemData?.name}" has image: ${imageUrl.substring(0, 50)}...`);
          }
        }

        // Log modifier info for debugging
        if (modifierListIds.length > 0) {
          console.log(`[Menu API] Item "${item.itemData?.name}" has ${modifierListIds.length} modifier list(s):`, {
            modifierListIds,
            foundModifierLists: modifierLists.length,
          });
        }

        return {
          id: item.id,
          name: item.itemData?.name || "Unknown",
          description: item.itemData?.description || null,
          price: hasPrice
            ? squareMoneyToDollars(variation.itemVariationData.priceMoney.amount)
            : 0,
          category: categoryName.trim(), // Ensure category name is trimmed for exact matching
          categoryId: categoryId || null,
          image_url: imageUrl,
          available: !item.isDeleted,
          square_id: item.id,
          modifierLists: modifierLists.length > 0 ? modifierLists : undefined,
        };
      });

      // Extract unique categories from items (sorted alphabetically, but "Uncategorized" last)
      // Normalize category names to ensure exact matching
      const uniqueCategories = Array.from(new Set(items.map(item => item.category.trim())))
        .filter(Boolean)
        .sort((a, b) => {
          if (a === "Uncategorized") return 1;
          if (b === "Uncategorized") return -1;
          return a.localeCompare(b);
        });

      // Also include all categories from Square (even if no items are assigned to them)
      const allCategoryNames = Array.from(categoryMap.values()).map(name => name.trim());
      const combinedCategories = Array.from(new Set([...uniqueCategories, ...allCategoryNames]))
        .filter(Boolean)
        .sort((a, b) => {
          if (a === "Uncategorized") return 1;
          if (b === "Uncategorized") return -1;
          return a.localeCompare(b);
        });

      console.log("[Menu API] ✅ Final menu items processed:", {
        totalItems: items.length,
        itemsWithPrice: items.filter(i => i.price > 0).length,
        itemsWithoutPrice: items.filter(i => i.price === 0).length,
        itemsWithModifiers: items.filter(i => i.modifierLists && i.modifierLists.length > 0).length,
        itemsAvailable: items.filter(i => i.available).length,
        itemsDeleted: items.filter(i => !i.available).length,
        itemNames: items.map(i => i.name),
      });

      console.log("[Menu API] Categories found:", {
        totalCategories: combinedCategories.length,
        categories: combinedCategories,
        categoriesFromItems: uniqueCategories,
        categoriesFromSquare: allCategoryNames,
        itemsWithCategories: items.filter(i => i.category && i.category.trim() !== "Uncategorized").length,
        itemsUncategorized: items.filter(i => !i.category || i.category.trim() === "Uncategorized").length,
        categoryBreakdown: combinedCategories.map(cat => ({
          category: cat,
          itemCount: items.filter(i => i.category.trim() === cat).length,
        })),
      });

      // Filter by category if specified (use trimmed comparison for exact matching)
      if (category && category !== "all") {
        const normalizedCategory = category.trim();
        items = items.filter((item) => item.category.trim() === normalizedCategory);
        console.log(`[Menu API] Filtered items by category "${normalizedCategory}": ${items.length} items`);
      }

      return NextResponse.json({
        items,
        categories: combinedCategories, // Use combined categories (from items + Square catalog)
        source: "square",
        count: items.length,
      });
    } catch (squareError: any) {
      const statusCode = squareError?.statusCode || squareError?.status;
      const errors = squareError?.errors || [];

      console.error("[Menu API] Square API Error:", {
        message: squareError?.message,
        errors: errors,
        statusCode: statusCode,
        tokenPreview: process.env.SQUARE_ACCESS_TOKEN?.substring(0, 10) + "...",
      });

      return NextResponse.json(
        {
          error: true,
          source: "square",
          message: squareError?.message || "Failed to fetch menu items from Square",
          errors: errors,
          statusCode: statusCode,
          items: [],
          count: 0,
        },
        { status: statusCode || 500 }
      );
    }
  } catch (error: any) {
    console.error("[Menu API] Fatal Error:", {
      message: error?.message,
      stack: error?.stack,
    });

    return NextResponse.json(
      {
        error: true,
        message: "Failed to fetch menu items",
        details: error?.message || "Unknown error",
        items: [],
        count: 0,
      },
      { status: 500 }
    );
  }
}

// POST /api/menu - Not supported (menu items come from Square only)
export async function POST(request: Request) {
  return NextResponse.json(
    {
      error: "Menu items are managed through Square POS. Use Square Dashboard to add/edit items.",
    },
    { status: 405 }
  );
}
