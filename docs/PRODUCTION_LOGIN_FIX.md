# Fixing Login Issues in Production (Vercel)

## Problem
Login works on localhost but fails in production, even though using the same database.

## Most Common Causes

### 1. Missing Environment Variables in Vercel

**Critical:** These must be set in Vercel Dashboard:

#### Required Variables:
- `DATABASE_URL` - Your Supabase connection string
- `NEXTAUTH_SECRET` or `AUTH_SECRET` - Must be the SAME value as localhost
- `NEXTAUTH_URL` - Your production domain (e.g., `https://yourdomain.com`)

#### How to Set in Vercel:
1. Go to Vercel Dashboard → Your Project
2. Click **Settings** → **Environment Variables**
3. Add/Update these variables for **Production**, **Preview**, and **Development**:
   - `DATABASE_URL` = Your Supabase connection string
   - `NEXTAUTH_SECRET` = `hooligans-secret-key-change-in-production` (or generate a new one)
   - `NEXTAUTH_URL` = `https://your-production-domain.com` (your actual domain)

### 2. NEXTAUTH_URL Must Match Your Production Domain

**Important:** `NEXTAUTH_URL` must be your actual production domain, not localhost!

**Wrong:**
```env
NEXTAUTH_URL=http://localhost:3000
```

**Correct (for production):**
```env
NEXTAUTH_URL=https://yourdomain.com
```

### 3. AUTH_SECRET Must Be the Same

The `AUTH_SECRET` or `NEXTAUTH_SECRET` must be:
- Set in Vercel environment variables
- The SAME value as your local `.env` file
- A secure random string (not the example value)

**Generate a secure secret:**
```bash
openssl rand -base64 32
```

### 4. Database Connection Issues

Even though you're using the same database, production might have:
- Connection pool limits
- Network/firewall restrictions
- Different connection timeouts

**Check:**
- Verify `DATABASE_URL` is set correctly in Vercel
- Make sure Supabase allows connections from Vercel's IP ranges
- Check Vercel logs for database connection errors

### 5. Rate Limiting

Production has rate limiting enabled. If you're testing multiple times:
- Wait a few minutes between attempts
- Or temporarily disable rate limiting in production (not recommended)

## Step-by-Step Fix

### Step 1: Check Vercel Environment Variables

1. Go to **Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**
2. Verify these are set for **Production**:
   - `DATABASE_URL` ✅
   - `NEXTAUTH_SECRET` or `AUTH_SECRET` ✅
   - `NEXTAUTH_URL` ✅ (must be your production URL)

### Step 2: Update NEXTAUTH_URL

In Vercel, set `NEXTAUTH_URL` to your actual production domain:
- If your site is `https://hooligans.vercel.app`, use that
- If you have a custom domain, use that (e.g., `https://hooligans.com.au`)

### Step 3: Generate and Set AUTH_SECRET

1. Generate a secure secret:
   ```bash
   openssl rand -base64 32
   ```

2. Update both:
   - Your local `.env` file
   - Vercel environment variables (Production, Preview, Development)

### Step 4: Redeploy

After updating environment variables:
1. Go to Vercel Dashboard → **Deployments**
2. Click **Redeploy** on the latest deployment
3. Or push a new commit to trigger a new deployment

### Step 5: Check Vercel Logs

1. Go to Vercel Dashboard → Your Project → **Logs**
2. Try logging in
3. Look for `[NextAuth]` error messages
4. Check for database connection errors

## Common Error Messages

### "Authentication service error: "
- Usually means `AUTH_SECRET` is missing or incorrect
- Check Vercel environment variables

### "Invalid email or password"
- Database connection issue
- Password hash mismatch
- Check Vercel logs for database errors

### "Too many requests"
- Rate limiting is working
- Wait a few minutes and try again

## Quick Checklist

- [ ] `DATABASE_URL` is set in Vercel (Production)
- [ ] `NEXTAUTH_SECRET` is set in Vercel (Production) - same as local
- [ ] `NEXTAUTH_URL` is set in Vercel (Production) - your production domain
- [ ] All environment variables are set for **Production** environment
- [ ] Redeployed after updating environment variables
- [ ] Checked Vercel logs for errors

## Testing

After fixing:
1. Try logging in on production
2. Check browser console for errors
3. Check Vercel logs for `[NextAuth]` messages
4. Verify the session is created (check cookies)

## Still Not Working?

1. **Check Vercel Logs** - Look for specific error messages
2. **Compare Environment Variables** - Make sure local and production match
3. **Test Database Connection** - Verify Supabase is accessible from Vercel
4. **Check Network Tab** - See what error the login API returns
