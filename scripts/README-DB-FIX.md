# Database Connection Fix & User Check

## Problem
The database has too many open connections, preventing queries from running.

## Solution Steps

### Step 1: Restart the Development Server
**This is critical!** The dev server is holding onto database connections.

1. Stop your dev server (press `Ctrl+C` in the terminal where it's running)
2. Wait 5-10 seconds for connections to close
3. Restart: `npm run dev`

### Step 2: Check Registered Users

After restarting the server, you can check users in two ways:

#### Option A: Use the Debug Endpoint (Browser)
Visit: `http://localhost:3000/api/auth/debug`

This will show all registered users with their details.

#### Option B: Use the Script (Terminal)
```bash
npx tsx scripts/check-users.ts
```

### Step 3: If Still Having Issues

If you still get "too many connections" errors:

1. **Check your database connection limit:**
   - If using a hosted database (Supabase, Railway, etc.), check your plan's connection limit
   - Free tiers often have 5-10 connection limits

2. **Close idle connections:**
   - Restart your PostgreSQL database if you have access
   - Or wait 30 seconds for idle connections to timeout (we set idleTimeoutMillis: 30000)

3. **Check for connection leaks:**
   - Make sure you're not creating multiple Prisma clients
   - The code should reuse the singleton instance from `src/lib/db.ts`

## What the Fix Does

The updated `src/lib/db.ts` now:
- Limits connections to max 10
- Closes idle connections after 30 seconds
- Times out connection attempts after 5 seconds
- Handles pool errors gracefully

## Testing Authentication

Once the database is accessible:

1. Check if your user exists: Visit `/api/auth/debug`
2. If no user exists, register at `/auth/register`
3. Try logging in with your credentials
4. Check server logs for detailed authentication debugging

## Server Logs

When you try to sign in, watch your server terminal for logs like:
- `[NextAuth] Attempting login for email: ...`
- `[NextAuth] User found: ...`
- `[NextAuth] Password mismatch...` or `[NextAuth] Login successful...`

These logs will tell you exactly what's happening during authentication.
