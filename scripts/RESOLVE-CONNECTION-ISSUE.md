# Resolving Database Connection Issues

## Current Situation
Your database has reached its maximum connection limit. This prevents any new connections, including running the email normalization script.

## Solutions (in order of preference)

### Option 1: Restart Database (Recommended)
If you're using a hosted database service (Supabase, Railway, Neon, etc.):

1. **Go to your database provider's dashboard**
2. **Find the database restart/reset option**
3. **Restart the database** - this will close all connections
4. **Wait 30 seconds after restart**
5. **Run the normalization script:**
   ```bash
   npx tsx scripts/normalize-existing-emails.ts
   ```

### Option 2: Wait for Connections to Timeout
If you can't restart the database:

1. **Wait 5-10 minutes** for idle connections to timeout (they have a 30-second idle timeout, but may take longer)
2. **Make sure NO processes are running** that use the database:
   - No `npm run dev`
   - No other Node.js processes
   - No other scripts
3. **Run the normalization script:**
   ```bash
   npx tsx scripts/normalize-existing-emails.ts
   ```

### Option 3: Close Connections via Database Admin (Advanced)
If you have direct database access:

1. **Connect to your database** using a database client (pgAdmin, DBeaver, etc.)
2. **Run this SQL query** to see connections:
   ```sql
   SELECT pid, usename, application_name, state, state_change
   FROM pg_stat_activity
   WHERE datname = current_database();
   ```
3. **Terminate idle connections:**
   ```sql
   SELECT pg_terminate_backend(pid)
   FROM pg_stat_activity
   WHERE datname = current_database()
     AND state = 'idle'
     AND pid != pg_backend_pid();
   ```

### Option 4: Check Database Connection Limit
Your database might have a very low connection limit (common on free tiers):

- **Supabase Free Tier**: 60 connections
- **Railway Free Tier**: 5-10 connections
- **Neon Free Tier**: 100 connections

If you're hitting the limit frequently, consider:
- Upgrading your database plan
- Reducing the connection pool size further (already set to 5 for dev, 10 for prod)

## Prevention
The connection pool has been optimized to:
- Use max 5 connections in development
- Use max 10 connections in production
- Close idle connections after 30 seconds
- Properly cleanup on shutdown

After resolving the connection issue, the new pool settings should prevent this from happening again.

## Next Steps After Resolving
Once you can connect to the database:

1. **Run email normalization:**
   ```bash
   npx tsx scripts/normalize-existing-emails.ts
   ```

2. **Restart your dev server:**
   ```bash
   npm run dev
   ```

3. **Test authentication flows** to ensure everything works correctly
