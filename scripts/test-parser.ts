
// Mock of the function from src/lib/squareCatalogParser.ts
function extractCategoryIds(
    item: any,
    itemVariations: any[]
): string[] {
    const categoryIds: string[] = [];

    // Rule 1: Primary source - item.item_data.categories[] (snake_case) or item.itemData.categories[] (camelCase)
    const itemCategories = (item as any).item_data?.categories ||
        item.itemData?.categories ||
        null;

    if (Array.isArray(itemCategories) && itemCategories.length > 0) {
        // This is what the current code does directly:
        // categoryIds.push(...itemCategories);

        // Simulating the behavior:
        itemCategories.forEach(c => categoryIds.push(c));

        return categoryIds; // Primary source found, return immediately
    }

    return categoryIds;
}

const sampleItem = {
    "type": "ITEM",
    "itemData": {
        "name": "Latte",
        "categories": [
            {
                "id": "FDLM6KURTGR2O2YFLFOUJXQ7",
                "ordinal": "-2251799780130816"
            }
        ]
    },
    "id": "WM7TIHXIIYEJQIH6I6MPS6OQ"
};

const ids = extractCategoryIds(sampleItem, []);
console.log("Extracted IDs:", ids);
console.log("Type of first ID:", typeof ids[0]);

if (typeof ids[0] === 'object') {
    console.log("FAIL: IDs are objects, not strings!");
} else {
    console.log("SUCCESS: IDs are strings.");
}
