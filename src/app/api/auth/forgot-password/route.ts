import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendPasswordResetEmail } from "@/lib/email";
import { rateLimit, getClientIdentifier } from "@/lib/rateLimit";
import { emailSchema } from "@/lib/validation";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    // Rate limiting: 3 requests per hour per IP
    const identifier = getClientIdentifier(request);
    const rateLimitResult = rateLimit(`forgot-password:${identifier}`, 3, 60 * 60 * 1000);
    
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { 
          error: "Too many password reset requests. Please try again later.",
          retryAfter: Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000),
        },
        { 
          status: 429,
          headers: {
            "Retry-After": Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000).toString(),
            "X-RateLimit-Limit": "3",
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": new Date(rateLimitResult.resetAt).toISOString(),
          },
        }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error("[ForgotPassword] JSON parse error:", parseError);
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    const { email } = body;

    // Validate email
    const emailValidation = emailSchema.safeParse(email);
    if (!emailValidation.success) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    const normalizedEmail = emailValidation.data;

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        email: true,
        name: true,
        provider: true,
        password: true,
      },
    });

    // Always return success to prevent email enumeration
    // But only send email if user exists and has a password (not OAuth-only user)
    if (user && user.password && user.provider === "credentials") {
      // Generate secure random token
      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1); // Token expires in 1 hour

      // Invalidate any existing tokens for this user
      await prisma.passwordResetToken.updateMany({
        where: {
          user_id: user.id,
          used: false,
        },
        data: {
          used: true,
        },
      });

      // Create new reset token
      await prisma.passwordResetToken.create({
        data: {
          token,
          user_id: user.id,
          expires_at: expiresAt,
        },
      });

      // Send password reset email
      try {
        await sendPasswordResetEmail({
          to: user.email,
          resetToken: token,
          userName: user.name,
        });
      } catch (emailError) {
        console.error("[ForgotPassword] Failed to send email:", emailError);
        // Don't fail the request if email fails, but log it
      }
    }

    // Always return success message (security best practice - prevents email enumeration)
    return NextResponse.json({
      message: "If an account with that email exists, a password reset link has been sent.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Failed to process password reset request" },
      { status: 500 }
    );
  }
}
