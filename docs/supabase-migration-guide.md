# Supabase Migration Guide

## How to Run the Migration in Supabase

1. **Open Supabase Dashboard**
   - Go to your Supabase project dashboard
   - Navigate to **SQL Editor** in the left sidebar

2. **Run the Migration**
   - Open the file `supabase_migration.sql`
   - Copy the entire contents
   - Paste into the Supabase SQL Editor
   - Click **Run** or press `Ctrl+Enter` (or `Cmd+Enter` on Mac)

3. **Verify the Migration**
   - Check that all tables were created successfully
   - You should see 7 tables:
     - `users`
     - `menu_items`
     - `orders`
     - `cafe_settings`
     - `disabled_menu_items`
     - `disabled_categories`
     - `password_reset_tokens`

## Important Notes

- The migration uses `CREATE TABLE IF NOT EXISTS` so it's safe to run multiple times
- All indexes and foreign keys are included
- Default values match your Prisma schema
- The migration includes triggers for `updated_at` fields

## After Migration

1. Update your `.env` file with your Supabase connection string:
   ```
   DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT-REF].supabase.co:5432/postgres"
   ```

2. Run Prisma generate to sync the client:
   ```bash
   npx prisma generate
   ```

3. (Optional) Run Prisma migrate to mark as applied:
   ```bash
   npx prisma migrate resolve --applied supabase_migration
   ```
