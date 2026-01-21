import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Debug endpoint to check users in database
// Only available in development
export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 });
  }

  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        provider: true,
        password: true, // Include password to check if it exists
        is_admin: true,
        created_at: true,
      },
    });

    // Map users with password status
    const usersWithPasswordStatus = users.map((user) => ({
      ...user,
      hasPassword: !!user.password,
      password: user.password ? "***hidden***" : null, // Don't expose actual password
    }));

    return NextResponse.json({
      totalUsers: usersWithPasswordStatus.length,
      users: usersWithPasswordStatus.map((u) => ({
        id: u.id,
        email: u.email,
        name: u.name,
        provider: u.provider,
        hasPassword: u.hasPassword,
        isAdmin: u.is_admin,
        createdAt: u.created_at,
      })),
    });
  } catch (error) {
    console.error("Debug endpoint error:", error);
    return NextResponse.json(
      { error: "Failed to fetch users", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
