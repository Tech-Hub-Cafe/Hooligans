import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { listCatalogItems, searchCatalogObjects, squareMoneyToDollars, isSquareConfigured } from "@/lib/square";
import {
  buildCategoryMap,
  extractCategoryIds,
  resolveCategoryNames,
  normalizeItem,
  separateCatalogObjects,
} from "@/lib/squareCatalogParser";

// Helper to safely serialize objects for logging (converts BigInt to string)
function safeSerialize(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'bigint') return obj.toString();
  if (Array.isArray(obj)) return obj.map(safeSerialize);
  if (typeof obj === 'object') {
    const result: any = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = safeSerialize(value);
    }
    return result;
  }
  return obj;
}

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
      // Use SearchCatalogObjects to fetch ITEM, CATEGORY, and ITEM_VARIATION
      // with include_related_objects: true to get all related objects in one call
      console.log("[Menu API] Using SearchCatalogObjects with ITEM, CATEGORY, ITEM_VARIATION and include_related_objects: true");
      
      const allCatalogObjects: any[] = [];
      let cursor: string | null = null;
      let pageCount = 0;
      
      do {
        pageCount++;
        if (pageCount > 100) {
          console.warn(`[Menu API] Reached max pages (100), stopping pagination`);
          break;
        }
        
        const response = await searchCatalogObjects(
          ["ITEM", "CATEGORY", "ITEM_VARIATION"], 
          cursor || undefined, 
          true // include_related_objects: true
        );
        
        if (response.objects && response.objects.length > 0) {
          allCatalogObjects.push(...response.objects);
          console.log(`[Menu API] Page ${pageCount}: ${response.objects.length} objects (total: ${allCatalogObjects.length})`);
        } else {
          console.log(`[Menu API] Page ${pageCount}: No objects returned`);
        }
        
        cursor = response.cursor || null;
        if (cursor) {
          console.log(`[Menu API] Page ${pageCount}: Has cursor, fetching next page...`);
        } else {
          console.log(`[Menu API] Page ${pageCount}: No cursor, pagination complete`);
        }
      } while (cursor);
      
      console.log(`[Menu API] ✅ Finished fetching: ${allCatalogObjects.length} total objects across ${pageCount} page(s)`);
      
      // Separate objects by type using canonical parser
      const { items: catalogItems, categories, itemVariations } = separateCatalogObjects(allCatalogObjects);
      
      const itemsResponse = { objects: catalogItems };
      const itemVariationsResponse = { objects: itemVariations };
      const categoriesResponse = { objects: categories };
      
      // Also fetch modifier lists, modifiers, and images separately (not included in the main fetch)
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

      // Fetch modifier lists, modifiers, and images separately
      const [modifierListsResponse, modifiersResponse, imagesResponse] = await Promise.all([
        fetchAllPages("MODIFIER_LIST").catch(() => ({ objects: [] })),
        fetchAllPages("MODIFIER").catch(() => ({ objects: [] })),
        fetchAllPages("IMAGE").catch(() => ({ objects: [] })),
      ]);

      console.log("[Menu API] Square API Response (all pages fetched):", {
        hasItems: !!itemsResponse.objects,
        itemCount: itemsResponse.objects?.length || 0,
        hasItemVariations: !!itemVariationsResponse.objects,
        itemVariationCount: itemVariationsResponse.objects?.length || 0,
        hasCategories: !!categoriesResponse.objects,
        categoryCount: categoriesResponse.objects?.length || 0,
        hasModifierLists: !!modifierListsResponse.objects,
        modifierListCount: modifierListsResponse.objects?.length || 0,
        hasModifiers: !!modifiersResponse.objects,
        modifierCount: modifiersResponse.objects?.length || 0,
        hasImages: !!imagesResponse.objects,
        imageCount: imagesResponse.objects?.length || 0,
      });

      // Build category map using canonical parser
      const categoryMapObj = buildCategoryMap(categoriesResponse.objects);
      
      // Convert to Map for compatibility with existing code
      const categoryMap = new Map<string, string>();
      Object.entries(categoryMapObj).forEach(([id, name]) => {
        categoryMap.set(id, name);
      });
      
      if (categoryMap.size === 0) {
        console.warn("[Menu API] ⚠️ No categories found in Square catalog - all items will be uncategorized");
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
            // Safely convert price from BigInt to number
            let modifierPrice = 0;
            if (modifierData?.priceMoney?.amount) {
              const amount = modifierData.priceMoney.amount;
              modifierPrice = typeof amount === 'bigint' 
                ? Number(amount) / 100 
                : squareMoneyToDollars(amount);
            }
            const modifierId = mod.id || modifierData.id;
            modifierMap.set(modifierId, {
              id: modifierId,
              name: modifierData.name,
              price: modifierPrice,
              square_id: modifierId,
            });
            console.log(`[Menu API] Mapped modifier: ${modifierId} -> ${modifierData.name} ($${modifierPrice.toFixed(2)})`);
          } else {
            // Log modifier structure without BigInt values to avoid serialization errors
            const safeModifier = {
              id: mod.id,
              type: mod.type,
              hasModifierData: !!mod.modifierData,
              modifierDataKeys: mod.modifierData ? Object.keys(mod.modifierData) : [],
            };
            console.warn(`[Menu API] Modifier ${mod.id} has no name in modifierData. Structure:`, safeModifier);
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
                    // Safely convert price from BigInt to number
                    let modifierPrice = 0;
                    if (modifierData.priceMoney?.amount) {
                      const amount = modifierData.priceMoney.amount;
                      modifierPrice = typeof amount === 'bigint' 
                        ? Number(amount) / 100 
                        : squareMoneyToDollars(amount);
                    }
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
          categories: Object.values(categoryMapObj),
          source: "square",
          count: 0,
          warning: "Square catalog is empty or has no ITEM type objects",
        });
      }

      console.log(`[Menu API] Processing ${itemsResponse.objects.length} items from Square...`);
      
      // Process items using canonical normalization
      let items = itemsResponse.objects.map((item: any, index: number) => {
        const itemName = item.itemData?.name || item.id || "Unknown";
        const variation = item.itemData?.variations?.[0];
        const hasPrice = !!variation?.itemVariationData?.priceMoney;
        const hasVariations = !!item.itemData?.variations && item.itemData.variations.length > 0;

        // Normalize item using canonical parser
        const normalized = normalizeItem(item, categoryMapObj, itemVariationsResponse.objects);
        
        // Resolve category names from IDs
        const categoryNames = resolveCategoryNames(normalized.categoryIds, categoryMapObj);
        
        // Use first category name for display (items can have multiple categories)
        const categoryName = categoryNames.length > 0 
          ? categoryNames[0] 
          : "Uncategorized";
        
        // Debug logging (only if debug flag is set)
        if (process.env.SQUARE_CATALOG_DEBUG === "true") {
          if (index === 0) {
            console.log(`[Menu API] 🔍 Normalized item structure for "${itemName}":`, {
              id: normalized.id,
              name: normalized.name,
              categoryIds: normalized.categoryIds,
              categoryNames: categoryNames,
              finalCategory: categoryName,
            });
          }
        }
        
        // Warn about items without variations or prices (always log these)
        if (!hasVariations) {
          console.warn(`[Menu API] ⚠️ Item "${itemName}" (${item.id}) has NO variations - it may not display correctly`);
        }

        if (!hasPrice) {
          console.warn(`[Menu API] ⚠️ Item "${itemName}" (${item.id}) has no price variation - will show as $0.00`);
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

        // Safely convert price from BigInt to number
        let price = 0;
        if (hasPrice && variation?.itemVariationData?.priceMoney?.amount) {
          const amount = variation.itemVariationData.priceMoney.amount;
          // Handle both BigInt and number types
          price = typeof amount === 'bigint' 
            ? Number(amount) / 100 
            : squareMoneyToDollars(amount);
        }

        return {
          id: item.id,
          name: item.itemData?.name || "Unknown",
          description: item.itemData?.description || null,
          price: price,
          category: categoryName.trim(), // Ensure category name is trimmed for exact matching
          categoryId: normalized.categoryIds.length > 0 ? normalized.categoryIds[0] : null,
          image_url: imageUrl,
          available: !item.isDeleted,
          square_id: item.id,
          modifierLists: modifierLists.length > 0 ? modifierLists : undefined,
        };
      });

      // Fetch disabled items and categories from database
      let disabledItems: any[] = [];
      let disabledCategories: any[] = [];
      
      try {
        [disabledItems, disabledCategories] = await Promise.all([
          prisma.disabledMenuItem.findMany(),
          prisma.disabledCategory.findMany().catch(() => []), // Gracefully handle if table doesn't exist yet
        ]);
      } catch (error) {
        console.error("[Menu API] Error fetching disabled items/categories:", error);
        // Continue with empty arrays if there's an error
        disabledItems = [];
        disabledCategories = [];
      }
      const disabledSquareIds = new Set(disabledItems.map(item => item.square_id));
      // Normalize category names for comparison (trim whitespace)
      const disabledCategoryNames = new Set(
        disabledCategories.map(cat => cat.category_name.trim())
      );
      
      console.log(`[Menu API] Disabled categories:`, Array.from(disabledCategoryNames));
      
      // Filter out disabled items
      let filteredItems = items.filter(item => !disabledSquareIds.has(item.square_id));
      console.log(`[Menu API] Filtered out ${disabledSquareIds.size} disabled items. Showing ${filteredItems.length} active items.`);
      
      // Filter out items from disabled categories
      const itemsBeforeCategoryFilter = filteredItems.length;
      filteredItems = filteredItems.filter(item => {
        const itemCategory = item.category.trim();
        const isDisabled = disabledCategoryNames.has(itemCategory);
        if (isDisabled) {
          console.log(`[Menu API] Filtering out item "${item.name}" from disabled category "${itemCategory}"`);
        }
        return !isDisabled;
      });
      console.log(`[Menu API] Filtered out ${itemsBeforeCategoryFilter - filteredItems.length} items from disabled categories. Showing ${filteredItems.length} active items.`);

      // Extract unique categories from filtered items only (sorted alphabetically, but "Uncategorized" last)
      // Normalize category names to ensure exact matching
      // Only include categories that are not disabled AND have items
      const uniqueCategories = Array.from(new Set(filteredItems.map(item => item.category.trim())))
        .filter(Boolean)
        .filter(cat => !disabledCategoryNames.has(cat))
        .sort((a, b) => {
          if (a === "Uncategorized") return 1;
          if (b === "Uncategorized") return -1;
          return a.localeCompare(b);
        });

      // Only use categories that have items (don't include empty categories from Square)
      // This ensures disabled categories are completely hidden
      const combinedCategories = uniqueCategories;

      console.log("[Menu API] ✅ Final menu items processed:", {
        totalItems: items.length,
        itemsWithPrice: items.filter(i => i.price > 0).length,
        itemsWithoutPrice: items.filter(i => i.price === 0).length,
        itemsWithModifiers: items.filter(i => i.modifierLists && i.modifierLists.length > 0).length,
        itemsAvailable: items.filter(i => i.available).length,
        itemsDeleted: items.filter(i => !i.available).length,
        itemsWithCategories: items.filter(i => i.category && i.category.trim() !== "Uncategorized").length,
        itemsUncategorized: items.filter(i => !i.category || i.category.trim() === "Uncategorized").length,
        categoryMappingSuccessRate: items.length > 0 ? `${((items.filter(i => i.category && i.category.trim() !== "Uncategorized").length / items.length) * 100).toFixed(1)}%` : "0%",
      });
      
      // Debug logging only
      if (process.env.SQUARE_CATALOG_DEBUG === "true") {
        const itemsWithCategories = items.filter(i => i.category && i.category.trim() !== "Uncategorized").length;
        const itemsUncategorized = items.filter(i => !i.category || i.category.trim() === "Uncategorized").length;
        
        console.log("[Menu API] Category breakdown:", {
          totalCategories: combinedCategories.length,
          categories: combinedCategories,
          categoryBreakdown: combinedCategories.map(cat => ({
            category: cat,
            itemCount: items.filter(i => i.category.trim() === cat).length,
          })),
        });
        
        if (itemsUncategorized > 0) {
          console.warn(`[Menu API] ⚠️ ${itemsUncategorized} items are uncategorized. Sample:`, 
            items.filter(i => !i.category || i.category.trim() === "Uncategorized")
              .slice(0, 5)
              .map(i => ({ name: i.name, id: i.id, square_id: i.square_id }))
          );
        }
      }

      // Filter by category if specified (use trimmed comparison for exact matching)
      if (category && category !== "all") {
        const normalizedCategory = category.trim();
        filteredItems = filteredItems.filter((item) => item.category.trim() === normalizedCategory);
        console.log(`[Menu API] Filtered items by category "${normalizedCategory}": ${filteredItems.length} items`);
      }

      // Final safety check: ensure all BigInt values are converted to numbers
      // This prevents serialization errors when NextResponse.json() tries to stringify
      const serializedItems = filteredItems.map(item => {
        const serialized: any = {
          ...item,
          // Ensure price is always a number
          price: typeof item.price === 'bigint' ? Number(item.price) / 100 : Number(item.price),
        };
        
        // Ensure modifierLists prices are numbers
        if (item.modifierLists) {
          serialized.modifierLists = item.modifierLists.map(ml => ({
            ...ml,
            modifiers: ml.modifiers.map(mod => ({
              ...mod,
              price: typeof mod.price === 'bigint' ? Number(mod.price) / 100 : Number(mod.price),
            })),
          }));
        }
        
        return serialized;
      });

      return NextResponse.json({
        items: serializedItems,
        categories: combinedCategories, // Use combined categories (from items + Square catalog)
        source: "square",
        count: serializedItems.length,
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
