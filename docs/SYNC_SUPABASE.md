# Syncing Your Project with Supabase

Since you've already run the SQL migration manually in Supabase, follow these steps:

## Step 1: Update DATABASE_URL

1. **Get your Supabase connection string:**
   - Go to Supabase Dashboard → Project Settings → Database
   - Find the "Connection string" section
   - Copy the "URI" connection string (it should look like):
     ```
     postgresql://postgres:[YOUR-PASSWORD]@[PROJECT-REF].supabase.co:5432/postgres
     ```

2. **Update your `.env` file:**
   ```bash
   DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@[PROJECT-REF].supabase.co:5432/postgres"
   ```

3. **Update Vercel environment variables:**
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Add/Update `DATABASE_URL` with your Supabase connection string
   - Make sure to set it for **Production**, **Preview**, and **Development** environments

## Step 2: Regenerate Prisma Client

Run this command to regenerate the Prisma Client with the new database connection:

```bash
npx prisma generate
```

This is already included in your `package.json` build script, so it will run automatically during builds.

## Step 3: Verify Database Connection (Optional but Recommended)

Test that your connection works:

```bash
npx prisma db pull
```

This will:
- Connect to your Supabase database
- Compare your Prisma schema with the actual database
- Show any differences (there shouldn't be any if the migration ran correctly)

If there are differences, you can either:
- Update your `prisma/schema.prisma` to match the database
- Or run additional migrations to sync the database with your schema

## Step 4: Test the Connection

You can test the connection by:

1. **Starting your dev server:**
   ```bash
   npm run dev
   ```

2. **Or using the test endpoint** (if you have one):
   - Visit `/api/test-db` in your browser

## Important Notes

- ✅ **You DON'T need to run `prisma migrate`** - since you ran the SQL manually, the database is already set up
- ✅ **You DON'T need to run `prisma migrate resolve`** - this is only if you want Prisma to track the migration in its history
- ✅ **The `postinstall` script** will automatically run `prisma generate` after `npm install` on Vercel
- ✅ **Your Prisma schema** should already match the database structure from the SQL migration

## Troubleshooting

If you get connection errors:

1. **Check your connection string** - make sure the password is URL-encoded if it contains special characters
2. **Verify Supabase allows connections** - check your Supabase project settings
3. **Check firewall/network** - Supabase should allow connections from anywhere by default
4. **Verify the migration ran successfully** - check Supabase SQL Editor → History to confirm

## Next Steps

After syncing:
1. Test authentication (login/register)
2. Test database operations (creating orders, etc.)
3. Deploy to Vercel with the updated `DATABASE_URL` environment variable
