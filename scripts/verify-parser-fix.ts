
import { extractCategoryIds } from "../src/lib/squareCatalogParser";

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

if (ids.length > 0 && typeof ids[0] === 'string') {
    console.log("SUCCESS: IDs correctly extracted as strings.");
} else {
    console.error("FAIL: IDs not extracted correctly or not strings.");
    process.exit(1);
}
