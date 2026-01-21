
import { SquareClient, SquareEnvironment } from "square";
import * as dotenv from "dotenv";
import path from "path";

// Load .env from root
dotenv.config({ path: path.resolve(process.cwd(), ".env") });
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") }); // Try .env.local too if it exists

async function testSquareConnection() {
    const token = process.env.SQUARE_ACCESS_TOKEN;
    const locationId = process.env.SQUARE_LOCATION_ID;

    console.log("Token present:", !!token);
    console.log("Location ID present:", !!locationId);

    if (!token) {
        console.error("SQUARE_ACCESS_TOKEN is missing!");
        return;
    }

    if (token.length < 10) {
        console.log("Token is suspiciously short: ", token);
    } else {
        console.log("Token preview:", token.substring(0, 10) + "...");
    }

    if (locationId) {
        console.log("Location ID:", locationId);
    } else {
        console.warn("WARNING: SQUARE_LOCATION_ID is missing! The API route will fail.");
    }

    const isSandbox = token.startsWith("EAAAl") || token.startsWith("sandbox");
    const environment = isSandbox ? SquareEnvironment.Sandbox : SquareEnvironment.Production;
    console.log("Environment:", isSandbox ? "Sandbox" : "Production");

    const client = new SquareClient({
        token: token,
        environment: environment,
    });

    try {
        console.log("\nAttempting to search catalog (ITEM, CATEGORY)...");
        const catalogResp = await client.catalog.search({
            objectTypes: ["ITEM", "CATEGORY"],
            limit: 5
        });

        // Square SDK v43 might return response.result or response directly - check both
        const result = (catalogResp as any).result || catalogResp;

        const items = result.objects?.filter((o: any) => o.type === "ITEM") || [];
        const categories = result.objects?.filter((o: any) => o.type === "CATEGORY") || [];

        console.log(`Found ${items.length} items and ${categories.length} categories in first page.`);

        if (items.length > 0) {
            console.log("Sample Item:", JSON.stringify(items[0], (key, value) =>
                typeof value === 'bigint' ? value.toString() : value
                , 2));
        } else {
            console.log("No items found. Raw objects count:", result.objects?.length);
        }

    } catch (error: any) {
        console.error("Error testing Square Connection:");
        if (error.statusCode) console.error("Status:", error.statusCode);
        if (error.errors) console.error("Errors:", JSON.stringify(error.errors, null, 2));
        else console.error(error);
    }
}

testSquareConnection();
