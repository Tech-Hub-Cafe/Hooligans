import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import {
  sendContactConfirmationViaSender,
  sendContactNotificationViaSender,
  isSenderConfigured,
} from "@/lib/sender";

// Validation schema
const contactSchema = z.object({
  name: z.string().min(1, "Name is required").max(255, "Name is too long"),
  email: z.string().email("Invalid email address"),
  subject: z.string().min(1, "Subject is required").max(255, "Subject is too long"),
  message: z.string().min(1, "Message is required").max(5000, "Message is too long"),
});

// Helper function to sanitize strings
function sanitizeString(str: string): string {
  return str.trim().replace(/[<>]/g, "");
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate input
    const validationResult = contactSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validationResult.error.issues.map((e) => ({
            field: e.path.join("."),
            message: e.message,
          })),
        },
        { status: 400 }
      );
    }

    const { name, email, subject, message } = validationResult.data;

    // Sanitize inputs
    const sanitizedName = sanitizeString(name);
    const sanitizedEmail = email.toLowerCase().trim();
    const sanitizedSubject = sanitizeString(subject);
    const sanitizedMessage = sanitizeString(message);

    // Store message in database
    const contactMessage = await prisma.contactMessage.create({
      data: {
        name: sanitizedName,
        email: sanitizedEmail,
        subject: sanitizedSubject,
        message: sanitizedMessage,
      },
    });

    // Get admin email from settings
    const settings = await prisma.cafeSettings.findFirst();
    const adminEmail = settings?.email;

    // Send emails via Sender only (non-blocking)
    const sendConfirmation = async () => {
      if (!isSenderConfigured()) {
        console.warn('[Contact API] Sender not configured, skipping confirmation email');
        return;
      }
      try {
        const result = await sendContactConfirmationViaSender({
          to: sanitizedEmail,
          name: sanitizedName,
        });
        if (result.success) console.log('[Contact API] Confirmation sent via Sender');
        else console.error('[Contact API] Sender confirmation failed:', result.message);
      } catch (err) {
        console.error('[Contact API] Failed to send confirmation email:', err);
      }
    };

    const sendNotification = async () => {
      if (!adminEmail || !isSenderConfigured()) {
        if (!adminEmail) console.warn('[Contact API] No admin email in settings, skipping notification');
        else if (!isSenderConfigured()) console.warn('[Contact API] Sender not configured, skipping notification');
        return;
      }
      try {
        const result = await sendContactNotificationViaSender({
          to: adminEmail,
          name: sanitizedName,
          email: sanitizedEmail,
          subject: sanitizedSubject,
          message: sanitizedMessage,
        });
        if (result.success) console.log('[Contact API] Notification sent via Sender');
        else console.error('[Contact API] Sender notification failed:', result.message);
      } catch (err) {
        console.error('[Contact API] Failed to send notification email:', err);
      }
    };

    Promise.all([sendConfirmation(), sendNotification()])
      .then(() => console.log('[Contact API] Emails sent successfully'))
      .catch((err) => console.error('[Contact API] Some emails failed:', err));

    return NextResponse.json(
      {
        success: true,
        message: "Your message has been sent successfully!",
        id: contactMessage.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error processing contact form:", error);
    return NextResponse.json(
      { error: "Failed to send message. Please try again later." },
      { status: 500 }
    );
  }
}
