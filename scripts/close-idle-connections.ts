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

async function closeIdleConnections() {
  // Use a separate connection for admin operations
  const adminPool = new PgPool({
    connectionString,
    max: 1,
  });

  try {
    console.log("🔍 Checking database connections...\n");

    // Get connection count
    const countResult = await adminPool.query(`
      SELECT count(*) as total, 
             count(*) FILTER (WHERE state = 'idle') as idle,
             count(*) FILTER (WHERE state = 'active') as active
      FROM pg_stat_activity 
      WHERE datname = current_database()
    `);

    const stats = countResult.rows[0];
    console.log(`📊 Current connections:`);
    console.log(`   Total: ${stats.total}`);
    console.log(`   Active: ${stats.active}`);
    console.log(`   Idle: ${stats.idle}\n`);

    if (parseInt(stats.idle) === 0) {
      console.log("✅ No idle connections to close\n");
      await adminPool.end();
      return;
    }

    console.log("🔄 Closing idle connections...\n");

    // Terminate idle connections (excluding our own)
    const terminateResult = await adminPool.query(`
      SELECT pg_terminate_backend(pid)
      FROM pg_stat_activity
      WHERE datname = current_database()
        AND state = 'idle'
        AND pid != pg_backend_pid()
        AND state_change < now() - interval '5 seconds'
    `);

    const terminated = terminateResult.rowCount || 0;
    console.log(`✅ Terminated ${terminated} idle connection(s)\n`);

    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Check again
    const finalCount = await adminPool.query(`
      SELECT count(*) as total
      FROM pg_stat_activity 
      WHERE datname = current_database()
    `);

    console.log(`📊 Remaining connections: ${finalCount.rows[0].total}\n`);

  } catch (error) {
    console.error("❌ Error closing connections:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
    }
  } finally {
    await adminPool.end();
    console.log("🔌 Admin connection closed");
  }
}

closeIdleConnections();
