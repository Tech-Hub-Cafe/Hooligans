import { NextResponse } from "next/server";
import { listLocations, getCatalogInfo, listCatalogItems, getSquareEnvironment } from "@/lib/square";

// GET /api/square/test - Test Square API connection
export async function GET() {
  try {
    const token = process.env.SQUARE_ACCESS_TOKEN;
    const locationId = process.env.SQUARE_LOCATION_ID;
    
    const squareEnvironment = getSquareEnvironment();
    
    const diagnostics: any = {
      configuration: {
        hasToken: !!token,
        tokenLength: token?.length || 0,
        tokenPreview: token ? `${token.substring(0, 15)}...` : "Not set",
        tokenStartsWith: token ? token.substring(0, 10) : "N/A",
        hasLocationId: !!locationId,
        locationId: locationId || "Not set",
        squareEnvironment: squareEnvironment,
        nodeEnv: process.env.NODE_ENV,
      },
    };

    if (!token) {
      return NextResponse.json({
        ...diagnostics,
        error: "SQUARE_ACCESS_TOKEN is not set in environment variables",
        solution: "Add SQUARE_ACCESS_TOKEN to your .env file",
      }, { status: 400 });
    }

    // Test 1: Try to get locations (simpler API call)
    try {
      console.log("[Square Test] Testing locations API...");
      const locationsResponse = await listLocations();
      
      diagnostics.locationsTest = {
        success: true,
        locationCount: locationsResponse.locations?.length || 0,
        locations: locationsResponse.locations?.map((loc: any) => ({
          id: loc.id,
          name: loc.name,
          status: loc.status,
        })) || [],
      };
    } catch (locationsError: any) {
      console.error("[Square Test] Locations API error:", locationsError);
      const statusCode = locationsError?.statusCode || locationsError?.status;
      const errors = locationsError?.errors || [];
      
      diagnostics.locationsTest = {
        success: false,
        error: locationsError?.message,
        statusCode: statusCode,
        errors: errors,
      };
    }

    // Test 2: Try to get catalog info
    try {
      console.log("[Square Test] Testing catalog API...");
      const catalogResponse = await getCatalogInfo();
      
      diagnostics.catalogTest = {
        success: true,
        version: catalogResponse.catalog?.version,
      };
    } catch (catalogError: any) {
      console.error("[Square Test] Catalog API error:", catalogError);
      diagnostics.catalogTest = {
        success: false,
        error: catalogError?.message,
        statusCode: catalogError?.statusCode || catalogError?.status,
        errors: catalogError?.errors || [],
      };
    }

    // Test 3: Try to list catalog items
    try {
      console.log("[Square Test] Testing catalog list API...");
      const listResponse = await listCatalogItems("ITEM");
      
      diagnostics.catalogListTest = {
        success: true,
        itemCount: listResponse.objects?.length || 0,
        hasCursor: !!listResponse.cursor,
      };
    } catch (listError: any) {
      console.error("[Square Test] Catalog list API error:", listError);
      diagnostics.catalogListTest = {
        success: false,
        error: listError?.message,
        statusCode: listError?.statusCode || listError?.status,
        errors: listError?.errors || [],
        fullError: listError,
      };
    }

    // Determine overall status
    const hasAnySuccess = 
      diagnostics.locationsTest?.success || 
      diagnostics.catalogTest?.success || 
      diagnostics.catalogListTest?.success;

    return NextResponse.json({
      ...diagnostics,
      overallStatus: hasAnySuccess ? "partial_success" : "failed",
      recommendations: generateRecommendations(diagnostics),
    }, { 
      status: hasAnySuccess ? 200 : 401 
    });
  } catch (error: any) {
    console.error("[Square Test] Fatal error:", error);
    return NextResponse.json({
      error: "Failed to test Square connection",
      message: error?.message,
      stack: process.env.NODE_ENV === "development" ? error?.stack : undefined,
    }, { status: 500 });
  }
}

function generateRecommendations(diagnostics: any): string[] {
  const recommendations: string[] = [];
  
  if (!diagnostics.configuration.hasToken) {
    recommendations.push("Add SQUARE_ACCESS_TOKEN to your .env file");
    return recommendations;
  }

  const tokenStart = diagnostics.configuration.tokenStartsWith;
  
  // Check token format
  if (tokenStart.startsWith("EAAAl")) {
    recommendations.push("Token appears to be a Sandbox token (starts with EAAAl)");
    recommendations.push("Ensure you're using Sandbox environment (which should be automatic)");
  } else if (tokenStart.startsWith("sq0at-")) {
    recommendations.push("Token appears to be a Production token (starts with sq0at-)");
    recommendations.push("Ensure you're using Production environment");
  } else if (tokenStart.startsWith("EAAA") && !tokenStart.startsWith("EAAAl")) {
    recommendations.push("Token appears to be a Production token (starts with EAAA)");
    recommendations.push("Ensure you're using Production environment");
  } else {
    recommendations.push("Token format is unusual. Verify it's a valid Square access token");
  }

  // Check for auth errors
  const allErrors = [
    diagnostics.locationsTest?.errors,
    diagnostics.catalogTest?.errors,
    diagnostics.catalogListTest?.errors,
  ].flat().filter(Boolean);

  const authErrors = allErrors.filter((e: any) => 
    e.category === "AUTHENTICATION_ERROR" || e.code === "UNAUTHORIZED"
  );

  if (authErrors.length > 0) {
    recommendations.push("Authentication failed. Your token may be:");
    recommendations.push("  - Expired (tokens can expire)");
    recommendations.push("  - Revoked or invalid");
    recommendations.push("  - Missing required permissions (need CATALOG_READ)");
    recommendations.push("  - For the wrong environment (Sandbox vs Production)");
    recommendations.push("Get a new token from: https://developer.squareup.com/apps");
  }

  return recommendations;
}

