import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  // Only allow in development
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "This endpoint is not available in production" },
      { status: 403 }
    );
  }

  try {
    // Test 1: Basic connection
    console.log("[DB Test] Testing database connection...");
    await prisma.$connect();
    console.log("[DB Test] ✓ Database connected");

    // Test 2: Simple query
    console.log("[DB Test] Testing simple query...");
    const userCount = await prisma.user.count();
    console.log("[DB Test] ✓ User count query successful:", userCount);

    // Test 3: Get all users (limited)
    console.log("[DB Test] Fetching users...");
    const users = await prisma.user.findMany({
      take: 10,
      select: {
        id: true,
        email: true,
        name: true,
        provider: true,
        password: true,
        is_admin: true,
        created_at: true,
      },
    });
    console.log("[DB Test] ✓ Users fetched:", users.length);

    // Test 4: Check database URL
    const dbUrl = process.env.DATABASE_URL;
    const dbUrlInfo = dbUrl
      ? {
          hasUrl: true,
          urlLength: dbUrl.length,
          startsWith: dbUrl.substring(0, 10),
          // Don't log the full URL for security
        }
      : { hasUrl: false };

    // Test 5: Check connection pool status
    const poolInfo = {
      // Prisma doesn't expose pool stats directly, but we can check if queries work
      connectionWorking: true,
    };

    return NextResponse.json({
      success: true,
      tests: {
        connection: "✓ Connected",
        query: "✓ Query successful",
        userCount,
        usersFound: users.length,
        users: users.map((u) => ({
          id: u.id,
          email: u.email,
          name: u.name,
          provider: u.provider,
          hasPassword: !!u.password,
          isAdmin: u.is_admin,
          createdAt: u.created_at,
        })),
        databaseInfo: dbUrlInfo,
        poolInfo,
      },
      message: "Database connection test successful",
    });
  } catch (error) {
    console.error("[DB Test] ✗ Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const errorStack = error instanceof Error ? error.stack : undefined;

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        stack: process.env.NODE_ENV === "development" ? errorStack : undefined,
        message: "Database connection test failed",
      },
      { status: 500 }
    );
  } finally {
    // Don't disconnect in serverless environment, but log
    console.log("[DB Test] Test completed");
  }
}
