import { handlers } from "@/lib/auth";
import { NextResponse } from "next/server";
import { rateLimit, getClientIdentifier } from "@/lib/rateLimit";

// Wrap handlers with error handling to prevent HTML error pages
async function handleRequest(
  handler: (request: Request) => Promise<Response>,
  request: Request
): Promise<Response> {
  try {
    const response = await handler(request);
    
    // Ensure response is JSON-compatible
    if (!response.ok) {
      const status = response.status;
      const statusText = response.statusText;
      
      console.error(`[NextAuth] Handler returned error: ${status} ${statusText}`);
      
      // If response is HTML (error page), convert to JSON
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("text/html")) {
        const text = await response.text();
        console.error("[NextAuth] Received HTML error page instead of JSON:", text.substring(0, 200));
        
        // Determine error code based on status
        let errorCode = "AuthenticationError";
        if (status === 401) errorCode = "Unauthorized";
        else if (status === 403) errorCode = "Forbidden";
        else if (status === 404) errorCode = "NotFound";
        else if (status >= 500) errorCode = "ServerError";
        
        return NextResponse.json(
          {
            error: errorCode,
            message: `Authentication service error: ${statusText}`,
            status,
          },
          { 
            status,
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
      }
    }
    
    return response;
  } catch (error) {
    console.error("[NextAuth] Handler error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    // Log full error details for debugging in development
    if (process.env.NODE_ENV === "development") {
      const errorStack = error instanceof Error ? error.stack : undefined;
      console.error("[NextAuth] Full error details:", {
        message: errorMessage,
        stack: errorStack,
        error,
      });
    }
    
    // Determine error code
    let errorCode = "ServerError";
    if (errorMessage.includes("database") || errorMessage.includes("connection")) {
      errorCode = "DatabaseError";
    } else if (errorMessage.includes("network") || errorMessage.includes("fetch")) {
      errorCode = "NetworkError";
    }
    
    return NextResponse.json(
      {
        error: errorCode,
        message: "An unexpected error occurred during authentication",
        details: process.env.NODE_ENV === "development" ? errorMessage : undefined,
      },
      { 
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}

export async function GET(request: Request) {
  try {
    // Check if this is a session request - handle it more gracefully
    const url = new URL(request.url);
    const isSessionRequest = url.pathname.includes("/api/auth/session");
    
    // Rate limiting: 10 requests per 15 minutes per IP for auth endpoints
    // But be more lenient for session requests (they happen frequently)
    const identifier = getClientIdentifier(request);
    const rateLimitWindow = isSessionRequest ? 30 * 60 * 1000 : 15 * 60 * 1000; // 30 min for session, 15 min for others
    const rateLimitMax = isSessionRequest ? 30 : 10; // More requests allowed for session checks
    
    const rateLimitResult = rateLimit(`auth:${identifier}`, rateLimitMax, rateLimitWindow);
    
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { 
          error: "Too many requests. Please try again later.",
          retryAfter: Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000),
        },
        { 
          status: 429,
          headers: {
            "Retry-After": Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000).toString(),
            "X-RateLimit-Limit": rateLimitMax.toString(),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": new Date(rateLimitResult.resetAt).toISOString(),
          },
        }
      );
    }

    if (!handlers?.GET) {
      console.error("[NextAuth] GET handler not available");
      return NextResponse.json(
        {
          error: "ConfigurationError",
          message: "Authentication handlers not initialized",
        },
        { 
          status: 500,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }
    
    // Add timeout for session requests to prevent hanging
    if (isSessionRequest) {
      const timeoutPromise = new Promise<Response>((_, reject) => {
        setTimeout(() => reject(new Error("Session request timeout")), 5000); // 5 second timeout
      });
      
      return await Promise.race([
        handleRequest(handlers.GET, request),
        timeoutPromise,
      ]);
    }
    
    return await handleRequest(handlers.GET, request);
  } catch (error) {
    // Fallback error handler in case handleRequest itself fails
    console.error("[NextAuth] GET handler failed:", error);
    
    // For session requests, return an empty session instead of an error
    const url = new URL(request.url);
    if (url.pathname.includes("/api/auth/session")) {
      return NextResponse.json(
        { user: null, expires: null },
        { 
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }
    
    return NextResponse.json(
      {
        error: "ServerError",
        message: "An unexpected error occurred",
        details: process.env.NODE_ENV === "development" 
          ? (error instanceof Error ? error.message : "Unknown error")
          : undefined,
      },
      { 
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}

export async function POST(request: Request) {
  try {
    // Rate limiting: 10 requests per 15 minutes per IP for auth endpoints
    const identifier = getClientIdentifier(request);
    const rateLimitResult = rateLimit(`auth:${identifier}`, 10, 15 * 60 * 1000);
    
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { 
          error: "Too many requests. Please try again later.",
          retryAfter: Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000),
        },
        { 
          status: 429,
          headers: {
            "Retry-After": Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000).toString(),
            "X-RateLimit-Limit": "10",
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": new Date(rateLimitResult.resetAt).toISOString(),
          },
        }
      );
    }

    if (!handlers?.POST) {
      console.error("[NextAuth] POST handler not available");
      return NextResponse.json(
        {
          error: "ConfigurationError",
          message: "Authentication handlers not initialized",
        },
        { 
          status: 500,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }
    return await handleRequest(handlers.POST, request);
  } catch (error) {
    // Fallback error handler in case handleRequest itself fails
    console.error("[NextAuth] POST handler failed:", error);
    return NextResponse.json(
      {
        error: "ServerError",
        message: "An unexpected error occurred",
        details: process.env.NODE_ENV === "development"
          ? (error instanceof Error ? error.message : "Unknown error")
          : undefined,
      },
      { 
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}
