import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool as PgPool } from "pg";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("❌ DATABASE_URL environment variable is not set");
  process.exit(1);
}

// Create a minimal pool for the script (only 1 connection to avoid conflicts)
// IMPORTANT: Stop your dev server before running this script to free up connections
const pool = new PgPool({
  connectionString,
  max: 1, // Use only 1 connection for the script
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 10000,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function normalizeEmails() {
  try {
    console.log("🔍 Starting email normalization...\n");
    console.log("⚠️  NOTE: Make sure your dev server is stopped to avoid connection conflicts\n");
    
    // Wait a moment for any existing connections to clear
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Get all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
      },
    });

    console.log(`📊 Found ${users.length} user(s) in database\n`);

    if (users.length === 0) {
      console.log("✅ No users to normalize");
      await prisma.$disconnect();
      await pool.end();
      return;
    }

    // Find users with non-normalized emails
    const usersToNormalize = users.filter(
      (user) => user.email !== user.email.toLowerCase()
    );

    if (usersToNormalize.length === 0) {
      console.log("✅ All emails are already normalized");
      await prisma.$disconnect();
      await pool.end();
      return;
    }

    console.log(`📝 Found ${usersToNormalize.length} user(s) with non-normalized emails:\n`);
    usersToNormalize.forEach((user) => {
      console.log(`   - ID ${user.id}: "${user.email}" → "${user.email.toLowerCase()}"`);
    });
    console.log();

    // Check for potential duplicates after normalization
    const normalizedEmails = new Map<string, number[]>();
    usersToNormalize.forEach((user) => {
      const normalized = user.email.toLowerCase();
      if (!normalizedEmails.has(normalized)) {
        normalizedEmails.set(normalized, []);
      }
      normalizedEmails.get(normalized)!.push(user.id);
    });

    const duplicates = Array.from(normalizedEmails.entries()).filter(
      ([, ids]) => ids.length > 1
    );

    if (duplicates.length > 0) {
      console.log("⚠️  WARNING: Potential duplicate emails after normalization:\n");
      duplicates.forEach(([email, ids]) => {
        console.log(`   - Email "${email}" would have ${ids.length} users: IDs ${ids.join(", ")}`);
      });
      console.log("\n❌ Cannot proceed with normalization due to potential duplicates.");
      console.log("💡 Please resolve duplicates manually before running this script.\n");
      await prisma.$disconnect();
      await pool.end();
      process.exit(1);
    }

    // Normalize emails
    console.log("🔄 Normalizing emails...\n");
    let normalizedCount = 0;

    for (const user of usersToNormalize) {
      const normalizedEmail = user.email.toLowerCase();
      
      try {
        await prisma.user.update({
          where: { id: user.id },
          data: { email: normalizedEmail },
        });
        normalizedCount++;
        console.log(`   ✓ Normalized user ID ${user.id}: "${user.email}" → "${normalizedEmail}"`);
      } catch (error) {
        console.error(`   ✗ Failed to normalize user ID ${user.id}:`, error);
        if (error instanceof Error) {
          // Check if it's a unique constraint violation
          if (error.message.includes("Unique constraint") || error.message.includes("duplicate")) {
            console.error(`     → Email "${normalizedEmail}" already exists. This is a duplicate.`);
          }
        }
      }
    }

    console.log(`\n✅ Successfully normalized ${normalizedCount} out of ${usersToNormalize.length} user(s)\n`);

    // Verify normalization
    const remainingNonNormalized = await prisma.user.findMany({
      where: {
        email: {
          not: {
            equals: prisma.user.fields.email,
          },
        },
      },
      select: { id: true, email: true },
    });

    // Actually, let's use a raw query to check
    const checkQuery = await prisma.$queryRaw<Array<{ id: number; email: string }>>`
      SELECT id, email
      FROM users
      WHERE email != LOWER(email)
    `;

    if (checkQuery.length > 0) {
      console.log("⚠️  Warning: Some emails were not normalized:");
      checkQuery.forEach((user) => {
        console.log(`   - ID ${user.id}: "${user.email}"`);
      });
      console.log();
    } else {
      console.log("✅ Verification: All emails are now normalized\n");
    }

  } catch (error) {
    console.error("❌ Error during email normalization:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      
      // Check if it's a connection error
      if (error.message.includes("too many clients") || error.message.includes("TooManyConnections")) {
        console.error("\n💡 SOLUTION:");
        console.error("   1. Stop your development server (Ctrl+C in the terminal where it's running)");
        console.error("   2. Wait 10-30 seconds for connections to close");
        console.error("   3. Run this script again: npx tsx scripts/normalize-existing-emails.ts\n");
      } else {
        console.error("Error stack:", error.stack);
      }
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    await pool.end();
    console.log("🔌 Database connections closed");
  }
}

normalizeEmails();
