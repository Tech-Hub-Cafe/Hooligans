import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { rateLimit, getClientIdentifier } from "@/lib/rateLimit";
import { validatePassword, registerSchema, sanitizeString } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    // Rate limiting: 5 registrations per 15 minutes per IP
    const identifier = getClientIdentifier(request);
    const rateLimitResult = rateLimit(`register:${identifier}`, 5, 15 * 60 * 1000);
    
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { 
          error: "Too many registration attempts. Please try again later.",
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
    
    // Validate input with Zod schema
    const validationResult = registerSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: "Validation failed",
          details: validationResult.error.issues.map(e => ({
            field: e.path.join("."),
            message: e.message,
          })),
        },
        { status: 400 }
      );
    }

    const { email, password, name, phone } = validationResult.data;

    // Additional password strength validation
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { error: passwordValidation.error },
        { status: 400 }
      );
    }

    // Normalize email (already done by Zod schema)
    const normalizedEmail = email;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists with this email" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Sanitize inputs
    const sanitizedName = name ? sanitizeString(name) : null;
    const sanitizedPhone = phone ? sanitizeString(phone) : null;

    // Create user
    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        password: hashedPassword,
        name: sanitizedName,
        phone: sanitizedPhone,
        provider: "credentials",
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    return NextResponse.json(
      { message: "User created successfully", user },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}

