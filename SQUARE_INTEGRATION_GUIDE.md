# Square POS Integration - Complete Guide

This is the complete guide for setting up and troubleshooting Square POS integration for Hooligans Cafe.

---

## Table of Contents

1. [Initial Setup](#initial-setup)
2. [Environment Variables](#environment-variables)
3. [Enabling Permissions](#enabling-permissions)
4. [Testing Your Setup](#testing-your-setup)
5. [Troubleshooting](#troubleshooting)
6. [Common Issues & Solutions](#common-issues--solutions)

---

## Initial Setup

### Step 1: Create/Login to Square Developer Account

1. Go to **https://developer.squareup.com/**
2. Click **"Sign In"** or **"Get Started"**
3. Sign in with your Square account (or create one if you don't have it)

### Step 2: Create a New Application

1. Once logged in, go to **"Applications"** in the left sidebar
2. Click **"New Application"** button
3. Fill in the application details:
   - **Application Name**: "Hooligans Cafe" (or your cafe name)
   - **Description**: "Online ordering system for Hooligans Cafe"
   - **Category**: Select "Food & Beverage" or "Retail"
4. Click **"Create Application"**

### Step 3: Get Your Sandbox Access Token

#### For Development/Testing (Sandbox):

1. In your application dashboard, go to **"Credentials"** tab
2. Scroll down to **"Sandbox"** section
3. Under **"Access Token"**, click **"Show"** or **"Reveal"**
4. Copy the access token (it will start with `EAAAl...`)
5. This is your **Sandbox Access Token** - use this for testing

#### For Production (Live):

1. In the **"Credentials"** tab, scroll to **"Production"** section
2. You'll need to complete the OAuth flow to get a production token
3. Production tokens start with `sq0at-...` or `EAAA...` (not `EAAAl`)

### Step 4: Get Your Location ID

1. In your Square Developer Dashboard, go to **"Locations"** in the left sidebar
2. You'll see a list of your locations
3. Copy the **Location ID** (it will look like `L2CTJ9XWYKHRY`)
4. If you don't have a location, you may need to:
   - Go to your Square Dashboard (not developer dashboard)
   - Set up a location there first
   - Then it will appear in the Developer Dashboard

### Step 5: Get Your Application ID

1. In your application dashboard, go to **"Credentials"** tab
2. At the top, you'll see **"Application ID"** (it will look like `sq0idp-...`)
3. Copy this Application ID

---

## Environment Variables

### The Difference: Server-Side vs Client-Side

#### Server-Side Variables (No `NEXT_PUBLIC_` prefix)
These are **secret** and only used in API routes (server-side):

```env
# Server-side only - NEVER expose to browser
SQUARE_ACCESS_TOKEN=EAAAl6O5-WCxVQEYmv5nmuZfkaIrH3sObPNfpGpjPKPvZciKyn4JOQNcvQwvyxn9
SQUARE_LOCATION_ID=L2CTJ9XWYKHRY
```

**Used in:**
- `/src/app/api/**/*.ts` (API routes)
- `/src/lib/square.ts` (Square client initialization)

#### Client-Side Variables (With `NEXT_PUBLIC_` prefix)
These are **public** and exposed to the browser:

```env
# Client-side - exposed to browser (safe to be public)
NEXT_PUBLIC_SQUARE_APPLICATION_ID=sq0idp-Bzr23BbmEpSfbJJLbhbmyAc
NEXT_PUBLIC_SQUARE_LOCATION_ID=L2CTJ9XWYKHRY
```

**Used in:**
- `/src/components/checkout/SquarePaymentForm.tsx` (Square Web Payments SDK)

### Which Ones Should Match?

#### ✅ `SQUARE_LOCATION_ID` and `NEXT_PUBLIC_SQUARE_LOCATION_ID`
**YES - These should have the SAME value!**

Both refer to the same Square location, but:
- `SQUARE_LOCATION_ID` = used server-side (API routes)
- `NEXT_PUBLIC_SQUARE_LOCATION_ID` = used client-side (payment form)

**Example:**
```env
SQUARE_LOCATION_ID=L2CTJ9XWYKHRY
NEXT_PUBLIC_SQUARE_LOCATION_ID=L2CTJ9XWYKHRY  # Same value!
```

#### ❌ `SQUARE_ACCESS_TOKEN` - NO `NEXT_PUBLIC_` version!
**NEVER create `NEXT_PUBLIC_SQUARE_ACCESS_TOKEN`!**

The access token is a **secret** and should **ONLY** be used server-side. Never expose it to the browser.

```env
# ✅ CORRECT - Server-side only
SQUARE_ACCESS_TOKEN=EAAAl6O5-WCxVQEYmv5nmuZfkaIrH3sObPNfpGpjPKPvZciKyn4JOQNcvQwvyxn9

# ❌ WRONG - Never do this!
# NEXT_PUBLIC_SQUARE_ACCESS_TOKEN=...  # DON'T CREATE THIS!
```

#### ✅ `NEXT_PUBLIC_SQUARE_APPLICATION_ID`
**This is different from the access token!**

The Application ID is **safe to be public** and is required for the Square Web Payments SDK in the browser.

```env
# This is fine - Application ID is public
NEXT_PUBLIC_SQUARE_APPLICATION_ID=sq0idp-Bzr23BbmEpSfbJJLbhbmyAc
```

### Complete .env.local Example

Here's what your `.env.local` should look like:

```env
# ============================================
# SQUARE CONFIGURATION
# ============================================

# Server-side only (API routes)
# These are SECRET - never expose to browser
SQUARE_ACCESS_TOKEN=EAAAl6O5-WCxVQEYmv5nmuZfkaIrH3sObPNfpGpjPKPvZciKyn4JOQNcvQwvyxn9
SQUARE_LOCATION_ID=L2CTJ9XWYKHRY

# Client-side (browser)
# These are PUBLIC - safe to expose
NEXT_PUBLIC_SQUARE_APPLICATION_ID=sq0idp-Bzr23BbmEpSfbJJLbhbmyAc
NEXT_PUBLIC_SQUARE_LOCATION_ID=L2CTJ9XWYKHRY  # Same as SQUARE_LOCATION_ID above!
```

**Important**: Replace the values above with your actual tokens from Steps 3-5.

### Summary Table

| Variable | Type | Same Value? | Used Where |
|----------|------|-------------|------------|
| `SQUARE_ACCESS_TOKEN` | Server-side (secret) | N/A | API routes only |
| `SQUARE_LOCATION_ID` | Server-side | ✅ **YES** | API routes |
| `NEXT_PUBLIC_SQUARE_LOCATION_ID` | Client-side (public) | ✅ **YES** | Payment form |
| `NEXT_PUBLIC_SQUARE_APPLICATION_ID` | Client-side (public) | N/A | Payment form |

### Common Mistakes

#### ❌ Mistake 1: Using access token in browser
```tsx
// ❌ WRONG - Don't do this!
const token = process.env.NEXT_PUBLIC_SQUARE_ACCESS_TOKEN;
```

#### ❌ Mistake 2: Different location IDs
```env
# ❌ WRONG - These should match!
SQUARE_LOCATION_ID=L2CTJ9XWYKHRY
NEXT_PUBLIC_SQUARE_LOCATION_ID=DIFFERENT_LOCATION_ID
```

#### ✅ Correct: Same location ID, different access
```env
# ✅ CORRECT
SQUARE_LOCATION_ID=L2CTJ9XWYKHRY           # Server-side
NEXT_PUBLIC_SQUARE_LOCATION_ID=L2CTJ9XWYKHRY  # Client-side (same value)
```

---

## Enabling Permissions

### Step-by-Step Guide

#### Step 1: Go to Your Application

1. Go to **https://developer.squareup.com/apps**
2. Sign in to your Square Developer account
3. Click on your application (e.g., "Hooligans Cafe" or whatever you named it)

#### Step 2: Navigate to OAuth Settings

1. In your application dashboard, look at the left sidebar
2. Click on **"OAuth"** (it should be in the menu, usually below "Credentials" or "Settings")

#### Step 3: Enable Required Scopes

1. You'll see a section called **"Scopes"** or **"OAuth Scopes"**
2. This will show a list of available permissions with checkboxes
3. Check the boxes for these required permissions:

   ✅ **`CATALOG_READ`**
   - Description: "Read catalog information"
   - Needed for: Reading menu items from Square catalog
   
   ✅ **`PAYMENTS_WRITE`**
   - Description: "Process payments"
   - Needed for: Processing customer payments
   
   ✅ **`ORDERS_WRITE`**
   - Description: "Create and update orders"
   - Needed for: Creating orders in Square

#### Step 4: Save Changes

1. After checking the boxes, scroll down
2. Click the **"Save"** or **"Update"** button
3. Wait for confirmation that changes were saved

#### Step 5: Verify Permissions

1. Refresh the page to make sure your selections are saved
2. The checked permissions should remain checked
3. You should see all three permissions enabled:
   - ✅ CATALOG_READ
   - ✅ PAYMENTS_WRITE
   - ✅ ORDERS_WRITE

### Alternative: If You Don't See OAuth Tab

If you don't see an "OAuth" tab, the permissions might be managed differently:

#### Option A: Check Application Settings

1. Look for **"Settings"** or **"Configuration"** in the left sidebar
2. Look for a section about **"API Permissions"** or **"Scopes"**
3. Enable the same three permissions there

#### Option B: Check Credentials Tab

1. Go to **"Credentials"** tab
2. Look for **"OAuth Scopes"** or **"Permissions"** section
3. Enable the permissions there

#### Option C: Sandbox vs Production

- **Sandbox**: Permissions are usually enabled by default for testing
- **Production**: You may need to explicitly enable them and complete OAuth flow

### Important Notes

1. **Sandbox Mode**: 
   - For development/testing, Sandbox permissions are usually enabled automatically
   - You can test with Sandbox tokens without OAuth

2. **Production Mode**:
   - For live/production, you'll need to complete the OAuth authorization flow
   - This requires users to authorize your app

3. **After Enabling**:
   - You may need to generate a **new access token** for the permissions to take effect
   - Go to "Credentials" → "Sandbox" → Generate new token if needed

### Visual Guide (What to Look For)

When you're in the OAuth section, you should see something like:

```
OAuth Scopes
─────────────
☐ CATALOG_READ          Read catalog information
☐ CATALOG_WRITE          Modify catalog
☐ PAYMENTS_READ          Read payment information
☐ PAYMENTS_WRITE         Process payments          ← CHECK THIS
☐ ORDERS_READ           Read order information
☐ ORDERS_WRITE          Create and update orders   ← CHECK THIS
☐ LOCATIONS_READ         Read location information
...
```

Make sure these are checked:
- ✅ CATALOG_READ
- ✅ PAYMENTS_WRITE  
- ✅ ORDERS_WRITE

### Quick Checklist

- [ ] Logged into Square Developer Dashboard
- [ ] Selected your application
- [ ] Found OAuth/Settings section
- [ ] Enabled CATALOG_READ
- [ ] Enabled PAYMENTS_WRITE
- [ ] Enabled ORDERS_WRITE
- [ ] Saved changes
- [ ] Generated new access token (if needed)
- [ ] Updated .env file with new token
- [ ] Restarted server

---

## Testing Your Setup

### Step 1: Restart Your Server

```bash
npm run dev
```

### Step 2: Test the Square API Connection

Visit: `http://localhost:3000/api/square/test`

This will show you detailed diagnostics about your Square connection, including:
- Configuration status
- Token format validation
- API connectivity tests
- Recommendations for any issues

**Look for:**
- `"overallStatus": "partial_success"` or success indicators
- `"catalogListTest": { "success": true }`
- No authentication errors

### Step 3: Test the Menu API

Visit: `http://localhost:3000/api/menu`

**Should return:**
- `"source": "square"` (if Square is working)
- `"items": [...]` (array of menu items)
- No 401 errors

### Step 4: Check the Menu Page

Visit: `http://localhost:3000/menu`

**Should show:**
- Menu items from Square (or database fallback)
- No error messages

---

## Troubleshooting

### "401 UNAUTHORIZED" Error

This is the most common error. Here's how to fix it:

#### Quick Fix Steps

1. **Get a Fresh Access Token**
   - Go to: https://developer.squareup.com/apps
   - Select your application
   - Go to **Credentials** → **Sandbox**
   - Click **"Show"** or **"Reveal"** to see the current token
   - If there's a **"Generate New Token"** or **"Reset"** button, click it
   - **Copy the entire token** (it should start with `EAAAl...`)

2. **Update Your .env File**
   ```env
   SQUARE_ACCESS_TOKEN=EAAAl...your-new-token-here
   ```
   - Make sure there are **no extra spaces** or quotes around the token
   - The token should be on one line

3. **Verify Permissions**
   - Go to **OAuth** tab in your application
   - Enable **CATALOG_READ**, **PAYMENTS_WRITE**, and **ORDERS_WRITE** scopes
   - Save changes
   - **Generate a new token** after saving (permissions apply to new tokens)

4. **Restart Your Server**
   ```bash
   # Stop the server (Ctrl+C) and restart:
   npm run dev
   ```

5. **Test Again**
   - Visit: http://localhost:3000/api/square/test
   - Should show success indicators

#### Common Causes of 401 Errors

- **Token expired**: Generate a new access token
- **Wrong environment**: Make sure you're using Sandbox token for development
- **Missing permissions**: Ensure `CATALOG_READ` permission is enabled
- **Invalid token**: Copy the token again - make sure there are no extra spaces
- **Token from wrong application**: Make sure you're using the token from the correct application

### "No items found"

- Your Square catalog might be empty
- Go to your Square Dashboard → Catalog
- Add some items to your catalog
- Make sure items are set to "Available"

### Token Format Issues

**Problem**: Token has extra spaces or quotes

**Solution**:
```env
# ❌ WRONG - has quotes
SQUARE_ACCESS_TOKEN="EAAAl6O5-W..."

# ❌ WRONG - has extra spaces
SQUARE_ACCESS_TOKEN= EAAAl6O5-W... 

# ✅ CORRECT - no quotes, no spaces
SQUARE_ACCESS_TOKEN=EAAAl6O5-WCxVQEYmv5nmuZfkaIrH3sObPNfpGpjPKPvZciKyn4JOQNcvQwvyxn9
```

### Wrong Environment

**Problem**: Using Production token in Sandbox mode (or vice versa)

**Solution**:
- **Sandbox tokens** start with `EAAAl...` (lowercase 'l')
- **Production tokens** start with `sq0at-...` or `EAAA...` (not `EAAAl`)
- Make sure you're using a Sandbox token for development

---

## Common Issues & Solutions

### Issue 1: Token Format Problems

**Problem**: Token has extra spaces or quotes

**Solution**:
```env
# ❌ WRONG - has quotes
SQUARE_ACCESS_TOKEN="EAAAl6O5-W..."

# ❌ WRONG - has extra spaces
SQUARE_ACCESS_TOKEN= EAAAl6O5-W... 

# ✅ CORRECT - no quotes, no spaces
SQUARE_ACCESS_TOKEN=EAAAl6O5-WCxVQEYmv5nmuZfkaIrH3sObPNfpGpjPKPvZciKyn4JOQNcvQwvyxn9
```

### Issue 2: Token Expired

**Problem**: Tokens can expire or be revoked

**Solution**:
- Generate a **completely new token** from the dashboard
- Don't reuse old tokens
- Sandbox tokens typically don't expire, but they can be revoked

### Issue 3: Wrong Environment

**Problem**: Using Production token in Sandbox mode (or vice versa)

**Solution**:
- **Sandbox tokens** start with `EAAAl...` (lowercase 'l')
- **Production tokens** start with `sq0at-...` or `EAAA...` (not `EAAAl`)
- Make sure you're using a Sandbox token for development

### Issue 4: Missing Permissions

**Problem**: Token doesn't have `CATALOG_READ` permission

**Solution**:
1. Go to **OAuth** tab in your application
2. Enable **CATALOG_READ** scope
3. **Generate a new token** (permissions only apply to new tokens)
4. Update your `.env` file with the new token

### Issue 5: Token from Wrong Application

**Problem**: Using a token from a different Square application

**Solution**:
- Make sure you're copying the token from the **correct application**
- Each application has its own tokens
- Check the Application ID matches your `NEXT_PUBLIC_SQUARE_APPLICATION_ID`

### Issue 6: Different Location IDs

**Problem**: `SQUARE_LOCATION_ID` and `NEXT_PUBLIC_SQUARE_LOCATION_ID` have different values

**Solution**:
```env
# ✅ CORRECT - These should match!
SQUARE_LOCATION_ID=L2CTJ9XWYKHRY
NEXT_PUBLIC_SQUARE_LOCATION_ID=L2CTJ9XWYKHRY  # Same value
```

---

## Step-by-Step Verification Checklist

Follow these steps in order:

- [ ] **Step 1**: Logged into https://developer.squareup.com/apps
- [ ] **Step 2**: Selected the correct application
- [ ] **Step 3**: Went to **Credentials** → **Sandbox**
- [ ] **Step 4**: Generated a **new** access token
- [ ] **Step 5**: Copied the **entire token** (no spaces, no quotes)
- [ ] **Step 6**: Updated `.env.local` file with new token
- [ ] **Step 7**: Verified token format in `.env.local` (no extra quotes/spaces)
- [ ] **Step 8**: Went to **OAuth** tab
- [ ] **Step 9**: Enabled **CATALOG_READ** permission
- [ ] **Step 10**: Enabled **PAYMENTS_WRITE** permission
- [ ] **Step 11**: Enabled **ORDERS_WRITE** permission
- [ ] **Step 12**: Saved OAuth changes
- [ ] **Step 13**: Generated **another new token** (after enabling permissions)
- [ ] **Step 14**: Updated `.env.local` with the latest token
- [ ] **Step 15**: Verified `SQUARE_LOCATION_ID` and `NEXT_PUBLIC_SQUARE_LOCATION_ID` match
- [ ] **Step 16**: Restarted server (`npm run dev`)
- [ ] **Step 17**: Tested at http://localhost:3000/api/square/test
- [ ] **Step 18**: Verified menu loads at http://localhost:3000/menu

---

## Quick Reference: Token Types

| Token Type | Starts With | Environment | Use Case |
|------------|-------------|-------------|----------|
| Sandbox | `EAAAl...` | Sandbox | Development/Testing |
| Sandbox | `sandbox-...` | Sandbox | Development/Testing |
| Production | `sq0at-...` | Production | Live/Production |
| Production | `EAAA...` (not `EAAAl`) | Production | Live/Production |

---

## Still Having Issues?

If you've followed all steps and still have problems:

1. **Double-check token format**:
   ```bash
   # In your terminal, check the token:
   node -e "console.log(process.env.SQUARE_ACCESS_TOKEN?.substring(0, 15))"
   ```

2. **Verify token in Square Dashboard**:
   - Go back to Credentials → Sandbox
   - Make sure the token you copied matches what's shown
   - Try generating a **completely fresh** token

3. **Check server logs**:
   - Look at your terminal where `npm run dev` is running
   - Check for any Square initialization errors
   - Look for token preview in logs

4. **Try the test endpoint**:
   - Visit http://localhost:3000/api/square/test
   - Read the `recommendations` section carefully
   - Follow any specific suggestions

5. **Contact Square Support**:
   - If nothing works, your Square account might have restrictions
   - Contact Square Developer Support: https://developer.squareup.com/docs/build-basics/using-rest-apis

---

## Useful Links

- **Square Developer Dashboard**: https://developer.squareup.com/apps
- **Square API Documentation**: https://developer.squareup.com/docs
- **Square Catalog API**: https://developer.squareup.com/reference/square/catalog-api
- **Square Payments API**: https://developer.squareup.com/reference/square/payments-api

---

## Next Steps

Once your Square integration is working:

1. **Add items to your Square catalog**:
   - Go to Square Dashboard → Catalog
   - Add menu items with prices, descriptions, and images
   - Set items as "Available"

2. **Test the payment flow**:
   - Add items to cart
   - Go through checkout
   - Test with Square's test card numbers

3. **Set up production**:
   - Complete OAuth flow for production
   - Get production access token
   - Update `.env.local` with production credentials

---

## Why This Matters

1. **Security**: Access tokens are secrets. If exposed to the browser, anyone could use your Square account.

2. **Functionality**: 
   - Server needs `SQUARE_ACCESS_TOKEN` to call Square APIs
   - Browser needs `NEXT_PUBLIC_SQUARE_APPLICATION_ID` to initialize Square Web Payments SDK
   - Both need the same `LOCATION_ID` to reference the same Square location

3. **Next.js Convention**:
   - Variables with `NEXT_PUBLIC_` prefix are bundled into the client-side JavaScript
   - Variables without `NEXT_PUBLIC_` are only available server-side
