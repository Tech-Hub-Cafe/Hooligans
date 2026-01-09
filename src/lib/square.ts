// Square API configuration and helper functions
// Using Square SDK

import { SquareClient, SquareEnvironment } from "square";

// Detect environment from token or use NODE_ENV
// Sandbox tokens typically start with "EAAAl" or "sandbox-"
// Production tokens typically start with "EAAA" or "sq0at-"
function detectSquareEnvironment(): SquareEnvironment {
  const token = process.env.SQUARE_ACCESS_TOKEN || "";
  const nodeEnv = process.env.NODE_ENV;
  
  // Explicit environment override
  if (process.env.SQUARE_ENVIRONMENT) {
    return process.env.SQUARE_ENVIRONMENT === "production" 
      ? SquareEnvironment.Production 
      : SquareEnvironment.Sandbox;
  }
  
  // Auto-detect from token format
  // Sandbox tokens: EAAAl... (lowercase 'l' after EAAA)
  if (token.startsWith("sandbox-") || token.startsWith("EAAAl")) {
    console.log("[Square] Detected Sandbox token (starts with EAAAl or sandbox-)");
    return SquareEnvironment.Sandbox;
  }
  
  // Production tokens: sq0at-... or EAAA... (but not EAAAl...)
  if (token.startsWith("sq0at-") || (token.startsWith("EAAA") && !token.startsWith("EAAAl"))) {
    console.log("[Square] Detected Production token");
    return SquareEnvironment.Production;
  }
  
  // Fallback to NODE_ENV
  return nodeEnv === "production" ? SquareEnvironment.Production : SquareEnvironment.Sandbox;
}

const squareEnvironment = detectSquareEnvironment();

// Initialize Square Client
const squareClient = new SquareClient({
  token: process.env.SQUARE_ACCESS_TOKEN || "",
  environment: squareEnvironment,
});

// Export API instances for direct access if needed
export const catalogApi = squareClient.catalog;
export const locationsApi = squareClient.locations;
export const paymentsApi = squareClient.payments;
export const ordersApi = squareClient.orders;

// Log configuration for debugging
if (process.env.SQUARE_ACCESS_TOKEN) {
  const tokenPreview = process.env.SQUARE_ACCESS_TOKEN.substring(0, 10) + "...";
  console.log("[Square API] Initialized:", {
    environment: squareEnvironment === SquareEnvironment.Production ? "production" : "sandbox",
    tokenPreview,
    hasLocationId: !!process.env.SQUARE_LOCATION_ID,
  });
}

// Helper to convert Square money to dollars
export function squareMoneyToDollars(amount: number | bigint | undefined): number {
  if (!amount) return 0;
  return Number(amount) / 100;
}

// Helper to convert dollars to Square money (cents)
export function dollarsToSquareMoney(amount: number): number {
  return Math.round(amount * 100);
}

// Helper to extract error details from Square API errors
export function extractSquareError(error: unknown): {
  message: string;
  statusCode?: number;
  errors?: Array<{ category?: string; code?: string; detail?: string }>;
  isAuthError: boolean;
} {
  if (error && typeof error === 'object') {
    const squareError = error as any;
    return {
      message: squareError.message || 'Square API error',
      statusCode: squareError.statusCode || squareError.status,
      errors: squareError.errors || [],
      isAuthError: squareError.statusCode === 401 || 
                   squareError.statusCode === 403 ||
                   squareError.status === 401 ||
                   squareError.status === 403,
    };
  }
  
  return {
    message: error instanceof Error ? error.message : 'Unknown error',
    isAuthError: false,
  };
}

// Helper to check if Square is properly configured
export function isSquareConfigured(): boolean {
  return !!(
    process.env.SQUARE_ACCESS_TOKEN && 
    process.env.SQUARE_LOCATION_ID
  );
}

// Get current Square environment
export function getSquareEnvironment(): 'production' | 'sandbox' {
  return squareEnvironment === SquareEnvironment.Production ? 'production' : 'sandbox';
}

// Square API functions using SDK

// List locations
export async function listLocations() {
  try {
    const response = await locationsApi.list();
    // HttpResponsePromise returns response with result property
    const result = (response as any).result || response;
    return {
      locations: result.locations || [],
    };
  } catch (error: any) {
    const squareError = extractSquareError(error);
    throw {
      statusCode: squareError.statusCode || 500,
      status: squareError.statusCode || 500,
      message: squareError.message,
      errors: squareError.errors || [],
    };
  }
}

// Get a specific location by ID (includes country information)
export async function getLocation(locationId: string) {
  try {
    // List all locations and find the one matching the ID
    const locationsResponse = await listLocations();
    const location = locationsResponse.locations?.find((loc: any) => loc.id === locationId);
    return location || null;
  } catch (error: any) {
    const squareError = extractSquareError(error);
    throw {
      statusCode: squareError.statusCode || 500,
      status: squareError.statusCode || 500,
      message: squareError.message,
      errors: squareError.errors || [],
    };
  }
}

// Get catalog info
export async function getCatalogInfo() {
  try {
    // The SDK doesn't have a direct catalogInfo method
    // We'll use listCatalog to get basic info
    const listResponse = await catalogApi.list({ types: "ITEM" });
    return {
      version: listResponse.data?.length || 0,
      catalog: {
        version: listResponse.data?.length || 0,
      },
    };
  } catch (error: any) {
    const squareError = extractSquareError(error);
    throw {
      statusCode: squareError.statusCode || 500,
      status: squareError.statusCode || 500,
      message: squareError.message,
      errors: squareError.errors || [],
    };
  }
}

// List catalog items
export async function listCatalogItems(types?: string | string[], cursor?: string) {
  try {
    const requestBody: any = {};
    if (types) {
      // SDK expects types to be a comma-separated string or array
      requestBody.types = Array.isArray(types) ? types.join(",") : types;
    }
    if (cursor) {
      requestBody.cursor = cursor;
    }

    console.log("[Square API] Catalog list request:", {
      types: requestBody.types,
      cursor: requestBody.cursor,
    });

    const response = await catalogApi.list(requestBody);
    
    // Log the full response structure to understand what Square SDK returns
    console.log("[Square API] Full response structure:", {
      hasResult: !!(response as any).result,
      hasData: !!(response as any).data,
      responseType: typeof response,
      responseKeys: Object.keys(response || {}),
      responseResultKeys: (response as any).result ? Object.keys((response as any).result) : [],
    });
    
    // Square SDK v43 might return response.result or response directly
    const result = (response as any).result || response;
    
    // Page<CatalogObject> has data property and cursor
    const objects = result.data || result.objects || [];
    
    // Try multiple ways to access cursor (SDK might return it differently)
    const responseCursor = result.cursor || 
                          result.cursor_ || 
                          result.nextCursor ||
                          (response as any).cursor ||
                          (response as any).cursor_ ||
                          (response as any).nextCursor ||
                          null;
    
    console.log("[Square API] Catalog list response:", {
      hasObjects: objects.length > 0,
      objectCount: objects.length,
      hasCursor: !!responseCursor,
      cursorValue: responseCursor?.substring(0, 50) || 'none',
      resultKeys: result ? Object.keys(result) : [],
    });
    
    // Also check if there's a cursor in the response wrapper
    const finalCursor = responseCursor || (response as any).cursor || null;
    
    return {
      objects: objects,
      cursor: finalCursor,
    };
  } catch (error: any) {
    const squareError = extractSquareError(error);
    console.error("[Square API] Catalog list error:", {
      statusCode: squareError.statusCode,
      message: squareError.message,
      errors: squareError.errors,
    });
    throw {
      statusCode: squareError.statusCode || 500,
      status: squareError.statusCode || 500,
      message: squareError.message,
      errors: squareError.errors || [],
    };
  }
}

// Create payment
export async function createPayment(paymentData: {
  sourceId: string;
  idempotencyKey: string;
  amountMoney: {
    amount: number;
    currency: string;
  };
  locationId: string;
  buyerEmailAddress?: string;
  note?: string;
}) {
  try {
    const response = await paymentsApi.create({
      sourceId: paymentData.sourceId,
      idempotencyKey: paymentData.idempotencyKey,
      amountMoney: {
        amount: BigInt(paymentData.amountMoney.amount),
        currency: paymentData.amountMoney.currency as any,
      },
      locationId: paymentData.locationId,
      buyerEmailAddress: paymentData.buyerEmailAddress,
      note: paymentData.note,
    });
    // HttpResponsePromise returns response with result property
    const result = (response as any).result || response;
    return {
      payment: result.payment,
    };
  } catch (error: any) {
    const squareError = extractSquareError(error);
    throw {
      statusCode: squareError.statusCode || 500,
      status: squareError.statusCode || 500,
      message: squareError.message,
      errors: squareError.errors || [],
    };
  }
}
