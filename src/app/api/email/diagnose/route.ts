import { NextResponse } from "next/server";
import { isSenderConfigured } from "@/lib/sender";

/**
 * GET /api/email/diagnose
 * Checks if email is configured (Sender.net only). No SMTP.
 */
export async function GET() {
  const senderConfigured = isSenderConfigured();
  return NextResponse.json({
    ok: senderConfigured,
    senderConfigured,
  });
}
