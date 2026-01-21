// Canonical Square Catalog Parser
// Provides stable, future-proof category resolution

interface NormalizedItem {
  id: string;
  name: string;
  categoryIds: string[];
  categoryNames: string[];
}

interface CategoryMap {
  [categoryId: string]: string;
}

interface CatalogObjects {
  items: any[];
  categories: any[];
  itemVariations: any[];
}

const DEBUG = process.env.SQUARE_CATALOG_DEBUG === "true";

/**
 * Build category lookup map from CATEGORY objects
 * Maps categoryId -> categoryName
 */
export function buildCategoryMap(categoryObjects: any[]): CategoryMap {
  const categoryMap: CategoryMap = {};

  categoryObjects.forEach((cat: any) => {
    // Handle both camelCase (SDK) and snake_case (raw API)
    const categoryName = cat.categoryData?.name ||
      cat.category_data?.name ||
      null;

    if (categoryName && cat.id) {
      categoryMap[cat.id] = categoryName.trim();

      if (DEBUG) {
        console.log(`[Catalog Parser] Mapped category: ${cat.id} -> "${categoryName.trim()}"`);
      }
    }
  });

  if (DEBUG) {
    console.log(`[Catalog Parser] Category map built: ${Object.keys(categoryMap).length} categories`);
  }

  return categoryMap;
}

/**
 * Extract category IDs from an item using canonical resolution rules
 * Rule 1: Primary source is item.item_data.categories[] (or item.itemData.categories[])
 * Rule 2: Fallback to variation-level category_id if primary is empty
 */
export function extractCategoryIds(
  item: any,
  itemVariations: any[]
): string[] {
  const categoryIds: string[] = [];

  // Rule 1: Primary source - item.item_data.categories[] (snake_case) or item.itemData.categories[] (camelCase)
  const itemCategories = (item as any).item_data?.categories ||
    item.itemData?.categories ||
    null;

  if (Array.isArray(itemCategories) && itemCategories.length > 0) {
    // Map to IDs if they are objects, otherwise use as is
    const ids = itemCategories.map((cat: any) => {
      if (typeof cat === 'object' && cat !== null) {
        return cat.id;
      }
      return cat;
    }).filter((id) => typeof id === 'string'); // Ensure we only get strings

    categoryIds.push(...ids);

    if (DEBUG) {
      console.log(`[Catalog Parser] Item "${item.itemData?.name || item.id}" has categories array:`, ids);
    }
    return categoryIds; // Primary source found, return immediately
  }

  // Rule 2: Fallback to variation-level category_id
  // Check embedded variations first
  if (item.itemData?.variations && Array.isArray(item.itemData.variations)) {
    for (const variation of item.itemData.variations) {
      const variationCategoryId = (variation as any).item_variation_data?.category_id ||
        variation.itemVariationData?.categoryId ||
        variation.itemVariationData?.category_id ||
        null;

      if (variationCategoryId && !categoryIds.includes(variationCategoryId)) {
        categoryIds.push(variationCategoryId);

        if (DEBUG) {
          console.log(`[Catalog Parser] Found category in embedded variation: ${variationCategoryId}`);
        }
        break; // Use first variation's category
      }
    }
  }

  // Check separate variation objects (when include_related_objects is true)
  if (categoryIds.length === 0 && itemVariations.length > 0) {
    // Find variations that belong to this item
    const itemVariationObjects = itemVariations.filter((variation: any) => {
      const variationItemId = (variation as any).item_variation_data?.item_id ||
        variation.itemVariationData?.itemId ||
        variation.itemVariationData?.item_id ||
        null;
      return variationItemId === item.id;
    });

    for (const variation of itemVariationObjects) {
      const variationCategoryId = (variation as any).item_variation_data?.category_id ||
        variation.itemVariationData?.categoryId ||
        variation.itemVariationData?.category_id ||
        null;

      if (variationCategoryId && !categoryIds.includes(variationCategoryId)) {
        categoryIds.push(variationCategoryId);

        if (DEBUG) {
          console.log(`[Catalog Parser] Found category in separate variation object: ${variationCategoryId}`);
        }
        break; // Use first variation's category
      }
    }
  }

  return categoryIds;
}

/**
 * Resolve category names from category IDs using the category map
 */
export function resolveCategoryNames(
  categoryIds: string[],
  categoryMap: CategoryMap
): string[] {
  return categoryIds
    .map((id) => categoryMap[id])
    .filter((name): name is string => !!name); // Remove undefined values
}

/**
 * Normalize a Square catalog item into stable internal structure
 */
export function normalizeItem(
  item: any,
  categoryMap: CategoryMap,
  itemVariations: any[]
): NormalizedItem {
  const categoryIds = extractCategoryIds(item, itemVariations);
  const categoryNames = resolveCategoryNames(categoryIds, categoryMap);

  return {
    id: item.id,
    name: item.itemData?.name || item.id || "Unknown",
    categoryIds,
    categoryNames,
  };
}

/**
 * Separate catalog objects by type
 */
export function separateCatalogObjects(allObjects: any[]): CatalogObjects {
  return {
    items: allObjects.filter((obj: any) => obj.type === "ITEM"),
    categories: allObjects.filter((obj: any) => obj.type === "CATEGORY"),
    itemVariations: allObjects.filter((obj: any) => obj.type === "ITEM_VARIATION"),
  };
}
