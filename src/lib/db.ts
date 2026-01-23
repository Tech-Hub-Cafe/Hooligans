import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool as PgPool } from "pg";

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
// Learn more: https://pris.ly/d/help/nextjs-best-practices

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pgPool: PgPool | undefined;
};

const connectionString = process.env.DATABASE_URL;

// Only throw error at runtime, not during build
// During build, DATABASE_URL may not be available
// Check if we're in a build context (Vercel sets VERCEL=1, but DATABASE_URL might not be available during build)
const isBuildTime = process.env.NEXT_PHASE === "phase-production-build" || 
                    (process.env.NODE_ENV === "production" && process.env.VERCEL && !process.env.DATABASE_URL);

if (!connectionString && !isBuildTime) {
  throw new Error("DATABASE_URL environment variable is not set");
}

// Connection pool configuration
// Reduced max connections for free tier databases (typically 5-10 connections)
const MAX_CONNECTIONS = process.env.NODE_ENV === "production" ? 10 : 5;
const IDLE_TIMEOUT = 30000; // 30 seconds
const CONNECTION_TIMEOUT = 5000; // 5 seconds

const getPrisma = () => {
  // Reuse existing client in all environments (not just development)
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma;
  }

  // Create a PostgreSQL pool for the adapter with optimized connection limits
  // This prevents "too many clients" errors, especially on free tier databases
  const pool = new PgPool({
    connectionString,
    max: MAX_CONNECTIONS, // Maximum number of clients in the pool
    idleTimeoutMillis: IDLE_TIMEOUT, // Close idle clients after 30 seconds
    connectionTimeoutMillis: CONNECTION_TIMEOUT, // Return an error after 5 seconds if connection could not be established
    allowExitOnIdle: true, // Allow process to exit when pool is idle
  });

  // Handle pool errors with better logging
  pool.on("error", (err) => {
    console.error("[Prisma] Unexpected error on idle client:", err.message);
    if (process.env.NODE_ENV === "development") {
      console.error("[Prisma] Full error:", err);
    }
  });

  // Monitor pool health in development
  if (process.env.NODE_ENV === "development") {
    pool.on("connect", () => {
      console.log(`[Prisma] New connection established. Pool size: ${pool.totalCount}, Idle: ${pool.idleCount}`);
    });

    pool.on("remove", () => {
      console.log(`[Prisma] Connection removed. Pool size: ${pool.totalCount}, Idle: ${pool.idleCount}`);
    });
  }

  const adapter = new PrismaPg(pool);

  const client = new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

  // Store in global for reuse in all environments
  globalForPrisma.prisma = client;
  globalForPrisma.pgPool = pool;

  // Graceful shutdown handling - only register once
  if (typeof process !== "undefined" && !globalForPrisma.pgPool) {
    const gracefulShutdown = async () => {
      console.log("[Prisma] Shutting down database connections...");
      try {
        if (globalForPrisma.prisma) {
          await globalForPrisma.prisma.$disconnect();
        }
        if (globalForPrisma.pgPool) {
          await globalForPrisma.pgPool.end();
        }
        console.log("[Prisma] Database connections closed");
      } catch (error) {
        console.error("[Prisma] Error during shutdown:", error);
      }
    };

    // Use once() to prevent multiple registrations
    process.once("beforeExit", gracefulShutdown);
    process.once("SIGINT", gracefulShutdown);
    process.once("SIGTERM", gracefulShutdown);
  }

  return client;
};

export const prisma = getPrisma();

// Export pool for health checks if needed
export const getPool = () => globalForPrisma.pgPool;

export default prisma;
