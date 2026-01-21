/**
 * Input validation schemas using Zod
 */

import { z } from "zod";

/**
 * Password validation
 */
export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (!password || typeof password !== "string") {
    return { valid: false, error: "Password is required" };
  }

  if (password.length < 8) {
    return { valid: false, error: "Password must be at least 8 characters long" };
  }

  if (password.length > 128) {
    return { valid: false, error: "Password must be less than 128 characters" };
  }

  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: "Password must contain at least one uppercase letter" };
  }

  if (!/[a-z]/.test(password)) {
    return { valid: false, error: "Password must contain at least one lowercase letter" };
  }

  if (!/[0-9]/.test(password)) {
    return { valid: false, error: "Password must contain at least one number" };
  }

  // Optional: require special character
  // if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
  //   return { valid: false, error: "Password must contain at least one special character" };
  // }

  return { valid: true };
}

/**
 * Email validation schema
 */
export const emailSchema = z
  .string()
  .email("Invalid email format")
  .toLowerCase()
  .trim()
  .max(255, "Email must be less than 255 characters");

/**
 * Registration schema
 */
export const registerSchema = z.object({
  email: emailSchema,
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().max(255, "Name must be less than 255 characters").trim().optional().nullable(),
  phone: z.string().max(50, "Phone must be less than 50 characters").trim().optional().nullable(),
});

/**
 * Order item schema
 */
export const orderItemSchema = z.object({
  id: z.union([z.number().int().positive(), z.string()]),
  name: z.string().min(1, "Item name is required").max(255, "Item name too long").trim(),
  price: z.number().nonnegative("Price cannot be negative").finite("Price must be a valid number"),
  quantity: z.number().int().positive("Quantity must be positive").max(100, "Quantity too high"),
  category: z.string().max(100).optional().nullable(),
});

/**
 * Order creation schema
 */
export const orderSchema = z.object({
  customer_name: z.string().min(1, "Name is required").max(255, "Name too long").trim(),
  customer_email: emailSchema,
  customer_phone: z.string().max(50, "Phone too long").trim().optional().nullable(),
  items: z.array(orderItemSchema).min(1, "At least one item is required"),
  total: z.number().nonnegative("Total cannot be negative").finite("Total must be a valid number"),
  special_instructions: z.string().max(1000, "Instructions too long").trim().optional().nullable(),
  user_id: z.union([z.number().int().positive(), z.string()]).optional().nullable(),
});

/**
 * Sanitize string input to prevent XSS
 */
export function sanitizeString(input: string | null | undefined): string {
  if (!input || typeof input !== "string") {
    return "";
  }

  return input
    .trim()
    .replace(/[<>]/g, "") // Remove potential HTML tags
    .substring(0, 10000); // Limit length
}
