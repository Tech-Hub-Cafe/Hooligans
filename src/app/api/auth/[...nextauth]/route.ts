import { handlers } from "@/lib/auth";
import { NextResponse } from "next/server";

// Wrap handlers with error handling to prevent HTML error pages
async function handleRequest(
  handler: (request: Request) => Promise<Response>,
  request: Request
): Promise<Response> {
  try {
    const response = await handler(request);
    // If response is already an error, return it
    if (!response.ok) {
      console.error("[NextAuth] Handler returned error:", response.status, response.statusText);
    }
    return response;
  } catch (error) {
    console.error("[NextAuth] Handler error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    // Log full error details for debugging
    console.error("[NextAuth] Full error details:", {
      message: errorMessage,
      stack: errorStack,
      error,
    });
    
    return NextResponse.json(
      {
        error: "Authentication error",
        message: errorMessage,
      },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  return handleRequest(handlers.GET, request);
}

export async function POST(request: Request) {
  return handleRequest(handlers.POST, request);
}

// Add error handling wrapper if needed
export async function GET_ORIGINAL(request: Request) {
  try {
    return handlers.GET(request);
  } catch (error) {
    console.error("[NextAuth] Error:", error);
    return NextResponse.json(
      { error: "Authentication error", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function POST_ORIGINAL(request: Request) {
  try {
    return handlers.POST(request);
  } catch (error) {
    console.error("[NextAuth] Error:", error);
    return NextResponse.json(
      { error: "Authentication error", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
