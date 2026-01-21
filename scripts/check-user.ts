
import { prisma } from "../src/lib/db";
import bcrypt from "bcryptjs";

async function main() {
    console.log("Checking database connection...");
    try {
        const userCount = await prisma.user.count();
        console.log(`Found ${userCount} users in the database.`);

        const email = "admin@hooligans.net.au";
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (user) {
            console.log(`✅ Admin user found: ${user.email}`);
            console.log(`   Provider: ${user.provider}`);
            console.log(`   Has password: ${!!user.password}`);
            console.log(`   Is Admin: ${user.is_admin}`);

            // Test password
            if (user.password) {
                const isMatch = await bcrypt.compare("adminpass", user.password);
                console.log(`   Password 'adminpass' match: ${isMatch ? "YES" : "NO"}`);
            }
        } else {
            console.log(`❌ Admin user '${email}' NOT found.`);
            console.log("   You may need to run 'npx prisma db seed'");
        }

    } catch (error) {
        console.error("❌ Database error:", error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
