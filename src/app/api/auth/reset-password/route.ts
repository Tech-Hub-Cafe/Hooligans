import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { validatePassword } from "@/lib/validation";
import { rateLimit, getClientIdentifier } from "@/lib/rateLimit";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    // Rate limiting: 5 attempts per hour per IP
    const identifier = getClientIdentifier(request);
    const rateLimitResult = rateLimit(`reset-password:${identifier}`, 5, 60 * 60 * 1000);
    
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { 
          error: "Too many password reset attempts. Please try again later.",
          retryAfter: Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000),
        },
        { 
          status: 429,
          headers: {
            "Retry-After": Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000).toString(),
            "X-RateLimit-Limit": "5",
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": new Date(rateLimitResult.resetAt).toISOString(),
          },
        }
      );
    }

    const body = await request.json();
    const { token, password } = body;

    if (!token || !password) {
      return NextResponse.json(
        { error: "Token and password are required" },
        { status: 400 }
      );
    }

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { error: passwordValidation.error },
        { status: 400 }
      );
    }

    // Find valid reset token
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            provider: true,
            password: true,
          },
        },
      },
    });

    // Check if token exists, is valid, and not expired
    if (!resetToken) {
      return NextResponse.json(
        { error: "Invalid or expired reset token" },
        { status: 400 }
      );
    }

    if (resetToken.used) {
      return NextResponse.json(
        { error: "This reset token has already been used" },
        { status: 400 }
      );
    }

    if (resetToken.expires_at < new Date()) {
      return NextResponse.json(
        { error: "This reset token has expired. Please request a new one." },
        { status: 400 }
      );
    }

    // Check if user exists and has password (not OAuth-only)
    if (!resetToken.user || !resetToken.user.password || resetToken.user.provider !== "credentials") {
      return NextResponse.json(
        { error: "Cannot reset password for this account type" },
        { status: 400 }
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update user password and mark token as used (in a transaction)
    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.user.id },
        data: { password: hashedPassword },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { used: true },
      }),
    ]);

    // Invalidate all other reset tokens for this user
    await prisma.passwordResetToken.updateMany({
      where: {
        user_id: resetToken.user.id,
        used: false,
        id: { not: resetToken.id },
      },
      data: {
        used: true,
      },
    });

    return NextResponse.json({
      message: "Password has been reset successfully. You can now sign in with your new password.",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { error: "Failed to reset password" },
      { status: 500 }
    );
  }
}
