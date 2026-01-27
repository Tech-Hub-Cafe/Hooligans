# Troubleshooting Admin Login

## Admin Credentials
- **Email:** `admin@hooligans.net.au` (all lowercase)
- **Password:** `adminpass`

## Common Issues and Solutions

### 1. Email Format
The system normalizes emails to lowercase, so these should all work:
- `admin@hooligans.net.au` ✅
- `Admin@Hooligans.Net.Au` ✅ (will be normalized)
- `ADMIN@HOOLIGANS.NET.AU` ✅ (will be normalized)

### 2. Password Issues
- Make sure you're typing: `adminpass` (no spaces, all lowercase)
- The password is case-sensitive

### 3. Admin User Doesn't Exist
If the admin user wasn't created, run:
```bash
npx tsx prisma/seed.ts
```

### 4. Database Connection Issues
If you see "500 error" or connection errors:
- Check that `DATABASE_URL` in `.env` is correct
- Make sure Supabase database is accessible
- Wait a few minutes if you see "max clients reached" error

### 5. Verify Admin Exists
Run this to check if admin exists:
```bash
npx tsx scripts/check-users.ts
```

### 6. Reset Admin Password
If you need to reset the admin password, you can:
1. Run the seed script again (it will update existing admin)
2. Or manually update in database

## Quick Test
1. Make sure your dev server is running: `npm run dev`
2. Go to `/auth/login`
3. Enter:
   - Email: `admin@hooligans.net.au`
   - Password: `adminpass`
4. Check browser console for any errors
5. Check server logs for `[NextAuth]` messages

## If Still Not Working
1. Check server logs for detailed error messages
2. Verify DATABASE_URL is set correctly
3. Make sure the database connection is working
4. Try creating a new user via registration to test if login works at all
