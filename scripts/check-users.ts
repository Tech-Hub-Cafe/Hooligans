import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool as PgPool } from "pg";
import * as dotenv from "dotenv";

// Load environment variables - try multiple locations
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("❌ DATABASE_URL environment variable is not set");
  process.exit(1);
}

// Create a PostgreSQL pool with connection limits
const pool = new PgPool({
  connectionString,
  max: 5, // Smaller pool for script
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
});

async function checkUsers() {
  try {
    console.log("🔍 Checking database connection...\n");
    
    // Test connection
    await prisma.$connect();
    console.log("✅ Database connected successfully\n");
    
    // Get user count
    const userCount = await prisma.user.count();
    console.log(`📊 Total users in database: ${userCount}\n`);
    
    if (userCount === 0) {
      console.log("⚠️  No users found in the database!");
      console.log("💡 You need to register a user first at /auth/register\n");
    } else {
      // Get all users
      const users = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          provider: true,
          password: true,
          is_admin: true,
          created_at: true,
        },
        orderBy: {
          created_at: "desc",
        },
      });
      
      console.log("👥 Registered Users:\n");
      console.log("=" .repeat(80));
      
      users.forEach((user, index) => {
        console.log(`\n${index + 1}. User ID: ${user.id}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Name: ${user.name || "N/A"}`);
        console.log(`   Provider: ${user.provider}`);
        console.log(`   Has Password: ${user.password ? "✅ Yes" : "❌ No (OAuth user)"}`);
        console.log(`   Is Admin: ${user.is_admin ? "✅ Yes" : "❌ No"}`);
        console.log(`   Created: ${user.created_at.toLocaleString()}`);
        
        if (user.password) {
          console.log(`   Password Hash: ${user.password.substring(0, 20)}...`);
        }
      });
      
      console.log("\n" + "=".repeat(80));
      console.log(`\n✅ Found ${users.length} user(s)\n`);
      
      // Show users that can login with credentials
      const credentialUsers = users.filter(u => u.password && u.provider === "credentials");
      const oauthUsers = users.filter(u => !u.password || u.provider === "google");
      
      console.log(`🔐 Users that can login with email/password: ${credentialUsers.length}`);
      if (credentialUsers.length > 0) {
        credentialUsers.forEach(u => {
          console.log(`   - ${u.email}`);
        });
      }
      
      console.log(`\n🔗 OAuth users (Google): ${oauthUsers.length}`);
      if (oauthUsers.length > 0) {
        oauthUsers.forEach(u => {
          console.log(`   - ${u.email}`);
        });
      }
    }
    
  } catch (error) {
    console.error("❌ Error:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
    }
  } finally {
    await prisma.$disconnect();
    console.log("\n🔌 Database connection closed");
  }
}

checkUsers();
