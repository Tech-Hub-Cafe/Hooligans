import { NextResponse } from "next/server";
import { getLocation, locationsApi } from "@/lib/square";

// GET /api/square/diagnose - Diagnose Square configuration
export async function GET() {
  const diagnostics: Record<string, any> = {
    timestamp: new Date().toISOString(),
    serverSide: {},
    recommendations: [],
  };

  try {
    // Check server-side environment variables
    const accessToken = process.env.SQUARE_ACCESS_TOKEN;
    const locationId = process.env.SQUARE_LOCATION_ID;
    const appId = process.env.SQUARE_APPLICATION_ID;
    const environment = process.env.SQUARE_ENVIRONMENT;

    diagnostics.serverSide = {
      hasAccessToken: !!accessToken,
      accessTokenPreview: accessToken ? `${accessToken.substring(0, 15)}...` : "NOT SET",
      accessTokenFormat: getTokenFormat(accessToken),
      hasLocationId: !!locationId,
      locationIdPreview: locationId ? `${locationId.substring(0, 10)}...` : "NOT SET",
      hasAppId: !!appId,
      appIdPreview: appId ? `${appId.substring(0, 15)}...` : "NOT SET",
      appIdFormat: getAppIdFormat(appId),
      explicitEnvironment: environment || "NOT SET (auto-detected)",
      nodeEnv: process.env.NODE_ENV,
    };

    // Detect environment from token
    const detectedEnv = detectEnvironmentFromToken(accessToken);
    diagnostics.serverSide.detectedEnvironment = detectedEnv;

    // Check if there's an environment mismatch
    if (environment && detectedEnv !== "unknown") {
      const envMatches = (environment.toLowerCase() === "production" && detectedEnv === "production") ||
                        (environment.toLowerCase() === "sandbox" && detectedEnv === "sandbox");
      diagnostics.serverSide.environmentMismatch = !envMatches;
      if (!envMatches) {
        diagnostics.recommendations.push({
          severity: "critical",
          issue: "Environment mismatch detected",
          details: `SQUARE_ENVIRONMENT is set to "${environment}" but token appears to be ${detectedEnv}`,
          fix: `Update SQUARE_ENVIRONMENT to match your token, or use the correct token for ${environment}`,
        });
      }
    }

    // Test API connectivity by fetching locations
    try {
      const locationsResponse = await locationsApi.list();
      const locations = locationsResponse.locations || [];
      
      diagnostics.apiConnectivity = {
        success: true,
        locationsFound: locations.length,
        locations: locations.map(loc => ({
          id: loc.id,
          name: loc.name,
          country: loc.country,
          status: loc.status,
          capabilities: loc.capabilities,
          isActive: loc.status === "ACTIVE",
          hasCardProcessing: loc.capabilities?.includes("CREDIT_CARD_PROCESSING"),
        })),
      };

      // Check if configured location exists and is valid
      const configuredLocation = locations.find(loc => loc.id === locationId);
      if (!configuredLocation) {
        diagnostics.recommendations.push({
          severity: "critical",
          issue: "Configured location not found",
          details: `Location ID "${locationId}" was not found in your Square account`,
          fix: "Update SQUARE_LOCATION_ID to one of the available locations",
          availableLocations: locations.map(loc => ({ id: loc.id, name: loc.name })),
        });
      } else {
        diagnostics.configuredLocation = {
          found: true,
          id: configuredLocation.id,
          name: configuredLocation.name,
          country: configuredLocation.country,
          status: configuredLocation.status,
          isActive: configuredLocation.status === "ACTIVE",
          capabilities: configuredLocation.capabilities,
          hasCardProcessing: configuredLocation.capabilities?.includes("CREDIT_CARD_PROCESSING"),
        };

        if (configuredLocation.status !== "ACTIVE") {
          diagnostics.recommendations.push({
            severity: "critical",
            issue: "Location is not active",
            details: `Location "${configuredLocation.name}" has status "${configuredLocation.status}"`,
            fix: "Activate this location in Square Dashboard or use a different active location",
          });
        }

        if (!configuredLocation.capabilities?.includes("CREDIT_CARD_PROCESSING")) {
          diagnostics.recommendations.push({
            severity: "critical",
            issue: "Location does not have credit card processing enabled",
            details: `Location "${configuredLocation.name}" is missing CREDIT_CARD_PROCESSING capability`,
            fix: "Enable credit card processing for this location in Square Dashboard",
          });
        }
      }
    } catch (apiError: any) {
      diagnostics.apiConnectivity = {
        success: false,
        error: apiError.message || "Unknown error",
        statusCode: apiError.statusCode,
        isAuthError: apiError.statusCode === 401,
      };

      if (apiError.statusCode === 401) {
        diagnostics.recommendations.push({
          severity: "critical",
          issue: "API authentication failed (401)",
          details: "The access token is invalid or expired",
          fix: "Generate a new access token in Square Developer Dashboard",
        });
      }
    }

    // Check client-side environment variables (NEXT_PUBLIC_*)
    const clientAppId = process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID;
    const clientLocationId = process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID;
    const clientEnvironment = process.env.NEXT_PUBLIC_SQUARE_ENVIRONMENT;

    diagnostics.clientSide = {
      hasAppId: !!clientAppId,
      appIdPreview: clientAppId ? `${clientAppId.substring(0, 15)}...` : "NOT SET",
      appIdFormat: getAppIdFormat(clientAppId),
      hasLocationId: !!clientLocationId,
      locationIdPreview: clientLocationId ? `${clientLocationId.substring(0, 10)}...` : "NOT SET",
      explicitEnvironment: clientEnvironment || "NOT SET (auto-detected)",
    };

    // Check for client/server ID mismatches
    if (appId && clientAppId && appId !== clientAppId) {
      diagnostics.recommendations.push({
        severity: "warning",
        issue: "Application ID mismatch between server and client",
        details: "SQUARE_APPLICATION_ID and NEXT_PUBLIC_SQUARE_APPLICATION_ID are different",
        fix: "Ensure both variables use the same Application ID",
      });
    }

    if (locationId && clientLocationId && locationId !== clientLocationId) {
      diagnostics.recommendations.push({
        severity: "warning",
        issue: "Location ID mismatch between server and client",
        details: "SQUARE_LOCATION_ID and NEXT_PUBLIC_SQUARE_LOCATION_ID are different",
        fix: "Ensure both variables use the same Location ID",
      });
    }

    // Check for common format issues
    if (clientAppId && !clientAppId.startsWith("sq0idp-") && !clientAppId.startsWith("sandbox-")) {
      diagnostics.recommendations.push({
        severity: "warning",
        issue: "Unusual Application ID format",
        details: `Expected production App ID to start with "sq0idp-" or sandbox with "sandbox-", got "${clientAppId.substring(0, 10)}..."`,
        fix: "Verify the Application ID is correct from Square Developer Dashboard",
      });
    }

    // Summary
    diagnostics.summary = {
      isConfigured: !!(accessToken && locationId && clientAppId && clientLocationId),
      hasErrors: diagnostics.recommendations.some((r: any) => r.severity === "critical"),
      errorCount: diagnostics.recommendations.filter((r: any) => r.severity === "critical").length,
      warningCount: diagnostics.recommendations.filter((r: any) => r.severity === "warning").length,
    };

    return NextResponse.json(diagnostics);
  } catch (error: any) {
    return NextResponse.json(
      {
        error: "Diagnostic check failed",
        message: error.message || "Unknown error",
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

function getTokenFormat(token: string | undefined): string {
  if (!token) return "NOT SET";
  if (token.startsWith("EAAAl")) return "Sandbox (EAAAl...)";
  if (token.startsWith("sandbox-")) return "Sandbox (sandbox-...)";
  if (token.startsWith("EAAAY")) return "Production (EAAAY...)";
  if (token.startsWith("EAAA") && !token.startsWith("EAAAl")) return "Production (EAAA...)";
  if (token.startsWith("sq0at-")) return "Production (sq0at-...)";
  return `Unknown format (${token.substring(0, 5)}...)`;
}

function getAppIdFormat(appId: string | undefined): string {
  if (!appId) return "NOT SET";
  if (appId.startsWith("sandbox-sq0idb-")) return "Sandbox";
  if (appId.startsWith("sq0idp-")) return "Production";
  return `Unknown format (${appId.substring(0, 10)}...)`;
}

function detectEnvironmentFromToken(token: string | undefined): string {
  if (!token) return "unknown";
  if (token.startsWith("EAAAl") || token.startsWith("sandbox-")) return "sandbox";
  if (token.startsWith("EAAAY") || token.startsWith("sq0at-") || 
      (token.startsWith("EAAA") && !token.startsWith("EAAAl"))) return "production";
  return "unknown";
}
