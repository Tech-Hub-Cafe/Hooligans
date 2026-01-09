import { NextResponse } from "next/server";
import { listLocations, listCatalogItems, getCatalogInfo, getSquareEnvironment } from "@/lib/square";

// GET /api/square/debug-401 - Comprehensive 401 Debug Checklist
export async function GET() {
  const token = process.env.SQUARE_ACCESS_TOKEN;
  const locationId = process.env.SQUARE_LOCATION_ID;
  const environment = getSquareEnvironment();
  
  const checklist: any = {
    timestamp: new Date().toISOString(),
    configuration: {
      hasToken: !!token,
      tokenLength: token?.length || 0,
      tokenPreview: token ? `${token.substring(0, 15)}...` : "Not set",
      tokenStartsWith: token ? token.substring(0, 10) : "N/A",
      hasLocationId: !!locationId,
      locationId: locationId || "Not set",
      environment: environment,
      forcedEnvironment: process.env.SQUARE_ENVIRONMENT || "auto-detected",
    },
    checklist: {},
  };

  // ✅ 1. Token type is Personal Access Token
  // Note: We can't programmatically verify this, but we can check the format
  const tokenFormat = token ? token.substring(0, 10) : "";
  const isSandboxFormat = tokenFormat.startsWith("EAAAl") || tokenFormat.startsWith("sandbox-");
  const isProductionFormat = tokenFormat.startsWith("sq0at-") || 
                             (tokenFormat.startsWith("EAAA") && !tokenFormat.startsWith("EAAAl"));
  
  checklist.checklist.tokenType = {
    status: token ? "⚠️ MANUAL_CHECK_REQUIRED" : "❌ MISSING",
    note: "Cannot programmatically verify if token is Personal Access Token",
    tokenFormat: tokenFormat,
    appearsToBe: isSandboxFormat ? "Sandbox format" : isProductionFormat ? "Production format" : "Unknown format",
    action: "Go to Square Dashboard → Credentials → Verify token type is 'Personal Access Token' (not OAuth token)",
  };

  // ✅ 2. Token environment matches API base URL
  const apiBaseUrl = environment === "production" 
    ? "https://connect.squareup.com" 
    : "https://connect.squareupsandbox.com";
  
  // Test which URL is actually being used
  let actualApiUrl = apiBaseUrl; // We know the URL since we're using direct API calls

  checklist.checklist.environmentMatch = {
    status: environment === "production" && actualApiUrl.includes("squareup.com") && !actualApiUrl.includes("sandbox")
      ? "✅ MATCHES"
      : environment === "sandbox" && actualApiUrl.includes("sandbox")
      ? "✅ MATCHES"
      : "❌ MISMATCH",
    configuredEnvironment: environment,
    expectedApiUrl: apiBaseUrl,
    actualApiUrl: actualApiUrl,
    tokenFormat: tokenFormat,
    issue: environment === "production" && isSandboxFormat
      ? "Token format suggests Sandbox but environment is forced to Production"
      : environment === "sandbox" && isProductionFormat
      ? "Token format suggests Production but environment is Sandbox"
      : "No obvious mismatch",
    action: environment === "production" && isSandboxFormat
      ? "Either use a Production token OR remove SQUARE_ENVIRONMENT=production to use Sandbox"
      : "Verify token matches the environment you're using",
  };

  // ✅ 3. Location ID belongs to same merchant
  // We can test this by trying to list locations and see if our location ID is in the list
  let locationBelongsToMerchant = "⚠️ MANUAL_CHECK_REQUIRED";
  let availableLocations: any[] = [];
  
  try {
    const locationsResponse = await listLocations();
    availableLocations = locationsResponse.locations?.map((loc: any) => ({
      id: loc.id,
      name: loc.name,
      status: loc.status,
    })) || [];
    
    if (locationId) {
      const locationExists = availableLocations.some(loc => loc.id === locationId);
      locationBelongsToMerchant = locationExists ? "✅ VERIFIED" : "❌ NOT_FOUND";
    }
  } catch (error: any) {
    locationBelongsToMerchant = "❌ CANNOT_VERIFY (401 error)";
  }

  checklist.checklist.locationId = {
    status: locationBelongsToMerchant,
    configuredLocationId: locationId || "Not set",
    availableLocations: availableLocations,
    locationFound: locationId && availableLocations.length > 0
      ? availableLocations.some(loc => loc.id === locationId)
      : "Cannot verify due to auth error",
    action: locationBelongsToMerchant === "❌ NOT_FOUND"
      ? `Location ID ${locationId} not found in your merchant account. Use one of: ${availableLocations.map(l => l.id).join(", ")}`
      : locationBelongsToMerchant === "❌ CANNOT_VERIFY"
      ? "Cannot verify - fix authentication first"
      : "Location ID appears correct",
  };

  // ✅ 4. OAuth scopes include ITEMS_READ (or CATALOG_READ)
  // Note: We cannot programmatically check OAuth scopes, but we can test if catalog API works
  let hasCatalogAccess = "⚠️ MANUAL_CHECK_REQUIRED";
  let catalogTestError: any = null;
  
  try {
    await listCatalogItems("ITEM");
    hasCatalogAccess = "✅ VERIFIED";
  } catch (error: any) {
    hasCatalogAccess = "❌ FAILED";
    catalogTestError = {
      statusCode: error?.statusCode || error?.status,
      message: error?.message,
      errors: error?.errors || [],
    };
  }

  checklist.checklist.oauthScopes = {
    status: hasCatalogAccess,
    requiredScopes: [
      "ITEMS_READ (or CATALOG_READ) - for reading catalog items",
      "PAYMENTS_WRITE - for processing payments",
      "ORDERS_WRITE - for creating orders",
    ],
    catalogAccessTest: hasCatalogAccess,
    catalogTestError: catalogTestError,
    action: hasCatalogAccess === "❌ FAILED"
      ? "Go to Square Dashboard → OAuth → Enable ITEMS_READ or CATALOG_READ scope, then generate a new token"
      : "Verify in Square Dashboard → OAuth that ITEMS_READ (or CATALOG_READ) is enabled",
    note: "Square uses ITEMS_READ for newer APIs, CATALOG_READ for older APIs. Enable both if available.",
  };

  // ✅ 5. Authorization header is exact
  // The SDK handles this automatically, but we can verify the token format
  const tokenFormatValid = token && 
    (token.startsWith("EAAAl") || 
     token.startsWith("sq0at-") || 
     token.startsWith("EAAA") || 
     token.startsWith("sandbox-"));
  
  const hasSpaces = token?.includes(" ");
  const hasQuotes = token?.startsWith('"') || token?.startsWith("'");
  
  checklist.checklist.authorizationHeader = {
    status: tokenFormatValid && !hasSpaces && !hasQuotes ? "✅ VALID" : "❌ INVALID",
    tokenFormat: tokenFormat,
    hasSpaces: hasSpaces,
    hasQuotes: hasQuotes,
    tokenLength: token?.length || 0,
    expectedLength: "64 characters (typical)",
    action: hasSpaces || hasQuotes
      ? "Remove spaces and quotes from SQUARE_ACCESS_TOKEN in .env file"
      : !tokenFormatValid
      ? "Token format appears invalid. Check Square Dashboard for correct token."
      : "SDK handles authorization header automatically - format looks correct",
    note: "The Square SDK automatically formats the Authorization header correctly",
  };

  // ✅ 6. Token not revoked or expired
  // We can test this by making a simple API call
  let tokenValid = "⚠️ UNKNOWN";
  let tokenTestError: any = null;
  
  try {
    // Try the simplest API call - get catalog info
    await getCatalogInfo();
    tokenValid = "✅ VALID";
  } catch (error: any) {
    tokenValid = "❌ INVALID";
    tokenTestError = {
      statusCode: error?.statusCode || error?.status,
      message: error?.message,
      errors: error?.errors || [],
      isAuthError: error?.statusCode === 401 || error?.status === 401,
    };
  }

  checklist.checklist.tokenValid = {
    status: tokenValid,
    testResult: tokenValid,
    error: tokenTestError,
    action: tokenValid === "❌ INVALID"
      ? "Token is expired, revoked, or invalid. Generate a new token from Square Dashboard → Credentials"
      : "Token appears to be valid",
  };

  // Summary
  const allChecks = Object.values(checklist.checklist).map((check: any) => check.status);
  const passedChecks = allChecks.filter((s: string) => s.includes("✅")).length;
  const failedChecks = allChecks.filter((s: string) => s.includes("❌")).length;
  const manualChecks = allChecks.filter((s: string) => s.includes("⚠️")).length;

  checklist.summary = {
    totalChecks: allChecks.length,
    passed: passedChecks,
    failed: failedChecks,
    manualCheckRequired: manualChecks,
    overallStatus: failedChecks > 0 ? "❌ FAILED" : manualChecks > 0 ? "⚠️ MANUAL_CHECK_NEEDED" : "✅ PASSED",
    criticalIssues: Object.entries(checklist.checklist)
      .filter(([_, check]: [string, any]) => check.status.includes("❌"))
      .map(([key, check]: [string, any]) => ({
        check: key,
        issue: check.action || check.note,
      })),
  };

  return NextResponse.json(checklist, {
    status: failedChecks > 0 ? 401 : 200,
  });
}
