import { NextResponse } from "next/server";
import { searchCatalogObjects, isSquareConfigured } from "@/lib/square";

// GET /api/square/debug-item-structure - Debug endpoint to see full item structure
export async function GET() {
  try {
    if (!isSquareConfigured()) {
      return NextResponse.json(
        { error: "Square POS is not configured" },
        { status: 503 }
      );
    }

    console.log("[Debug] Fetching catalog objects to analyze structure...");

    // Fetch first page only for debugging
    const response = await searchCatalogObjects(
      ["ITEM", "CATEGORY", "ITEM_VARIATION"],
      undefined,
      true // include_related_objects: true
    );

    const allObjects = response.objects || [];
    
    // Separate by type
    const items = allObjects.filter((obj: any) => obj.type === "ITEM");
    const categories = allObjects.filter((obj: any) => obj.type === "CATEGORY");
    const variations = allObjects.filter((obj: any) => obj.type === "ITEM_VARIATION");

    // Analyze first item in detail
    const firstItem = items[0];
    let itemAnalysis: any = null;

    if (firstItem) {
      // Safely extract item data without BigInt serialization issues
      const safeItemData: any = {
        id: firstItem.id,
        type: firstItem.type,
        isDeleted: firstItem.isDeleted,
        version: firstItem.version,
        updatedAt: firstItem.updatedAt,
        createdAt: firstItem.createdAt,
      };

      // Extract itemData fields safely
      if (firstItem.itemData) {
        safeItemData.itemData = {
          name: firstItem.itemData.name,
          description: firstItem.itemData.description,
          abbreviation: firstItem.itemData.abbreviation,
          labelColor: firstItem.itemData.labelColor,
          isTaxable: firstItem.itemData.isTaxable,
          // Check for categories array (both formats)
          categories: firstItem.itemData.categories || firstItem.itemData.categoryIds || null,
          categories_snake_case: (firstItem as any).item_data?.categories || null,
          // Check for deprecated category_id
          categoryId: firstItem.itemData.categoryId || null,
          categoryId_snake_case: (firstItem as any).item_data?.category_id || null,
          // Check variations
          hasVariations: !!firstItem.itemData.variations,
          variationCount: firstItem.itemData.variations?.length || 0,
          // Check modifier lists
          hasModifierListInfo: !!firstItem.itemData.modifierListInfo,
          modifierListInfoCount: Array.isArray(firstItem.itemData.modifierListInfo) 
            ? firstItem.itemData.modifierListInfo.length 
            : (firstItem.itemData.modifierListInfo ? 1 : 0),
          // Image IDs
          imageIds: firstItem.itemData.imageIds || null,
          // All keys in itemData
          itemDataKeys: Object.keys(firstItem.itemData),
        };

        // Analyze first variation if exists
        if (firstItem.itemData.variations && firstItem.itemData.variations.length > 0) {
          const firstVariation = firstItem.itemData.variations[0];
          safeItemData.firstVariation = {
            id: firstVariation.id,
            type: firstVariation.type,
            hasItemVariationData: !!firstVariation.itemVariationData,
            itemVariationDataKeys: firstVariation.itemVariationData 
              ? Object.keys(firstVariation.itemVariationData) 
              : [],
            // Check for category in variation
            categoryId: firstVariation.itemVariationData?.categoryId || null,
            categoryId_snake_case: (firstVariation as any).item_variation_data?.category_id || null,
            hasPrice: !!firstVariation.itemVariationData?.priceMoney,
          };
        }
      }

      // Check if item has direct category references in related objects
      const itemCategoryIds = firstItem.itemData?.categories || 
                             firstItem.itemData?.categoryIds || 
                             (firstItem as any).item_data?.categories || 
                             [];
      
      const itemRelatedObjects = allObjects.filter((obj: any) => {
        // Check if this object is referenced by the item's category IDs
        return obj.id && Array.isArray(itemCategoryIds) && itemCategoryIds.includes(obj.id);
      });

      safeItemData.relatedCategoryObjects = itemRelatedObjects.map((obj: any) => ({
        id: obj.id,
        type: obj.type,
        name: obj.categoryData?.name || obj.category_data?.name || "Unknown",
      }));

      itemAnalysis = safeItemData;
    }

    // Analyze category structure
    const firstCategory = categories[0];
    let categoryAnalysis: any = null;

    if (firstCategory) {
      categoryAnalysis = {
        id: firstCategory.id,
        type: firstCategory.type,
        name: firstCategory.categoryData?.name || firstCategory.category_data?.name || null,
        hasCategoryData: !!firstCategory.categoryData,
        hasCategory_data: !!(firstCategory as any).category_data,
        categoryDataKeys: firstCategory.categoryData ? Object.keys(firstCategory.categoryData) : [],
        category_dataKeys: (firstCategory as any).category_data ? Object.keys((firstCategory as any).category_data) : [],
      };
    }

    return NextResponse.json({
      summary: {
        totalObjects: allObjects.length,
        itemCount: items.length,
        categoryCount: categories.length,
        variationCount: variations.length,
      },
      firstItemAnalysis: itemAnalysis,
      firstCategoryAnalysis: categoryAnalysis,
      allItemKeys: items.length > 0 ? Object.keys(items[0]) : [],
      allCategoryKeys: categories.length > 0 ? Object.keys(categories[0]) : [],
      sampleItems: items.slice(0, 3).map((item: any) => ({
        id: item.id,
        name: item.itemData?.name,
        hasCategories: !!(item.itemData?.categories || item.itemData?.categoryIds),
        categories: item.itemData?.categories || item.itemData?.categoryIds || [],
        hasCategoryId: !!(item.itemData?.categoryId),
        categoryId: item.itemData?.categoryId || null,
      })),
      sampleCategories: categories.slice(0, 5).map((cat: any) => ({
        id: cat.id,
        name: cat.categoryData?.name || cat.category_data?.name || "Unknown",
      })),
    });
  } catch (error: any) {
    console.error("[Debug] Error:", error);
    return NextResponse.json(
      {
        error: error.message || "Failed to analyze item structure",
        details: error.errors || [],
      },
      { status: 500 }
    );
  }
}
