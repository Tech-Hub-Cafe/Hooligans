import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function requireAdmin() {
  const session = await auth();
  
  if (!session?.user) {
    return {
      authorized: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  
  if (!session.user.isAdmin) {
    return {
      authorized: false,
      response: NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 }),
    };
  }
  
  return {
    authorized: true,
    user: session.user,
  };
}

