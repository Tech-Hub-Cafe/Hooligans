import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool as PgPool } from "pg";
import bcrypt from "bcryptjs";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("❌ DATABASE_URL environment variable is not set");
  process.exit(1);
}

const pool = new PgPool({
  connectionString,
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function updateAdminPassword() {
  try {
    console.log("🔍 Updating admin password...\n");
    
    const adminEmail = "admin@hooligans.net.au";
    const adminPassword = "adminpass";
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    console.log(`📝 Generated password hash for: ${adminPassword}`);
    
    // Find the admin user
    const user = await prisma.user.findUnique({
      where: { email: adminEmail },
    });
    
    if (!user) {
      console.error(`❌ User ${adminEmail} not found!`);
      console.log("💡 Creating admin user...");
      
      const newUser = await prisma.user.create({
        data: {
          email: adminEmail,
          password: hashedPassword,
          name: "Admin",
          provider: "credentials",
          is_admin: true,
        },
      });
      
      console.log(`✅ Admin user created successfully!`);
      console.log(`📧 Email: ${newUser.email}`);
      console.log(`🔑 Password: ${adminPassword}`);
      console.log(`👤 Is Admin: ${newUser.is_admin}`);
    } else {
      // Update existing user
      const updatedUser = await prisma.user.update({
        where: { email: adminEmail },
        data: {
          password: hashedPassword,
          is_admin: true, // Ensure they're an admin
        },
      });
      
      console.log(`✅ Admin password updated successfully!`);
      console.log(`📧 Email: ${updatedUser.email}`);
      console.log(`🔑 Password: ${adminPassword}`);
      console.log(`👤 Is Admin: ${updatedUser.is_admin}`);
      
      // Verify the password works
      const testMatch = await bcrypt.compare(adminPassword, updatedUser.password || "");
      console.log(`\n🔐 Password verification: ${testMatch ? "✅ MATCH" : "❌ NO MATCH"}`);
    }
    
    console.log("\n✅ Done! You can now login with:");
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Password: ${adminPassword}`);
    
  } catch (error) {
    console.error("❌ Error updating admin password:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
    }
  } finally {
    await prisma.$disconnect();
    await pool.end();
    console.log("\n🔌 Database connection closed");
  }
}

updateAdminPassword();
