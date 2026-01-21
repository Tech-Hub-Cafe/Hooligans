/**
 * Environment variable validation and type-safe access
 * Validates all required environment variables at startup
 */

interface EnvConfig {
  // Database
  DATABASE_URL: string;
  
  // Authentication
  AUTH_SECRET?: string;
  NEXTAUTH_SECRET?: string;
  NEXTAUTH_URL?: string;
  
  // OAuth Providers
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  
  // Square API (optional, for payment processing)
  SQUARE_ACCESS_TOKEN?: string;
  SQUARE_APPLICATION_ID?: string;
  SQUARE_ENVIRONMENT?: string;
  
  // Node Environment
  NODE_ENV: "development" | "production" | "test";
}

class EnvValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EnvValidationError";
  }
}

/**
 * Validates that a required environment variable is set
 */
function requireEnv(key: keyof EnvConfig): string {
  const value = process.env[key];
  if (!value) {
    throw new EnvValidationError(
      `Required environment variable ${key} is not set`
    );
  }
  return value;
}

/**
 * Gets an optional environment variable
 */
function getEnv(key: keyof EnvConfig): string | undefined {
  return process.env[key];
}

/**
 * Validates all required environment variables
 * Throws EnvValidationError if any required variables are missing
 */
export function validateEnv(): void {
  const errors: string[] = [];

  // Required variables
  try {
    requireEnv("DATABASE_URL");
  } catch (error) {
    errors.push("DATABASE_URL is required");
  }

  // Authentication - at least one secret must be set
  const authSecret = getEnv("AUTH_SECRET") || getEnv("NEXTAUTH_SECRET");
  if (!authSecret) {
    errors.push("Either AUTH_SECRET or NEXTAUTH_SECRET must be set");
  }

  // OAuth - optional but recommended
  const hasGoogleOAuth = getEnv("GOOGLE_CLIENT_ID") && getEnv("GOOGLE_CLIENT_SECRET");
  if (!hasGoogleOAuth && process.env.NODE_ENV === "production") {
    console.warn(
      "[Env] Warning: Google OAuth credentials not set. Google sign-in will not work."
    );
  }

  if (errors.length > 0) {
    throw new EnvValidationError(
      `Environment validation failed:\n${errors.map((e) => `  - ${e}`).join("\n")}`
    );
  }
}

/**
 * Type-safe environment variable access
 */
export const env = {
  // Database
  DATABASE_URL: requireEnv("DATABASE_URL"),

  // Authentication
  AUTH_SECRET: getEnv("AUTH_SECRET") || getEnv("NEXTAUTH_SECRET") || "",
  NEXTAUTH_URL: getEnv("NEXTAUTH_URL"),

  // OAuth
  GOOGLE_CLIENT_ID: getEnv("GOOGLE_CLIENT_ID"),
  GOOGLE_CLIENT_SECRET: getEnv("GOOGLE_CLIENT_SECRET"),

  // Square (optional)
  SQUARE_ACCESS_TOKEN: getEnv("SQUARE_ACCESS_TOKEN"),
  SQUARE_APPLICATION_ID: getEnv("SQUARE_APPLICATION_ID"),
  SQUARE_ENVIRONMENT: getEnv("SQUARE_ENVIRONMENT"),

  // Node Environment
  NODE_ENV: (getEnv("NODE_ENV") || "development") as "development" | "production" | "test",

  // Helper methods
  isDevelopment: () => process.env.NODE_ENV === "development",
  isProduction: () => process.env.NODE_ENV === "production",
  isTest: () => process.env.NODE_ENV === "test",
};

// Validate on import (only in non-test environments)
if (process.env.NODE_ENV !== "test") {
  try {
    validateEnv();
  } catch (error) {
    if (error instanceof EnvValidationError) {
      console.error("[Env] Validation Error:", error.message);
      // In development, throw to fail fast
      // In production, log but don't crash (some vars might be set at runtime)
      if (process.env.NODE_ENV === "development") {
        throw error;
      }
    } else {
      throw error;
    }
  }
}

export default env;
