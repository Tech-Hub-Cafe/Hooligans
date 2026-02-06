import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/adminAuth";
import { sendTestEmailViaSender, isSenderConfigured } from "@/lib/sender";

const bodySchema = z.object({
  to: z.string().email("Invalid email address"),
});

/**
 * POST /api/email/test
 * Send a test email to the given address (admin only).
 * Uses Sender first, then SMTP fallback.
 */
export async function POST(request: Request) {
  const authResult = await requireAdmin();
  if (!authResult.authorized) {
    return authResult.response;
  }

  try {
    const body = await request.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message ?? "Invalid request" },
        { status: 400 }
      );
    }

    const { to } = parsed.data;

    if (!isSenderConfigured()) {
      return NextResponse.json(
        { success: false, error: "Email is not configured (Sender.net). Set SENDER_API_TOKEN and SENDER_FROM_EMAIL." },
        { status: 503 }
      );
    }

    try {
      const result = await sendTestEmailViaSender({ to });
      if (result.success) {
        return NextResponse.json({ success: true, via: "sender", to });
      }
      return NextResponse.json(
        { success: false, error: result.message || "Failed to send test email." },
        { status: 500 }
      );
    } catch (sendErr) {
      const message = sendErr instanceof Error ? sendErr.message : String(sendErr);
      return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[Email Test] Failed:", err);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
