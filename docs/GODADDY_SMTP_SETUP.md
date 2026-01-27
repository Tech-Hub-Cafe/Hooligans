# How to Find Your GoDaddy SMTP Credentials

## Step 1: Log into GoDaddy

1. Go to [godaddy.com](https://godaddy.com)
2. Click **Sign In** (top right)
3. Enter your GoDaddy account credentials

## Step 2: Access Email Settings

### Option A: If you have GoDaddy Workspace Email (Standard Email)

1. After logging in, go to **My Products**
2. Find **Email** section
3. Click on your email account (e.g., `yourname@yourdomain.com`)
4. Look for **Email Settings** or **Email Client Settings**
5. Click on **Email Client Settings** or **Set Up Email Client**

### Option B: If you have Microsoft 365 Email (Office 365)

1. Go to **My Products**
2. Find **Microsoft 365** section
3. Click **Manage** next to your Microsoft 365 subscription
4. Go to **Users** tab
5. Click on your email address
6. Look for **Email Client Settings** or **Mail Settings**

## Step 3: Find SMTP Settings

You should see something like this:

### For GoDaddy Workspace Email:
- **SMTP Server:** `smtpout.secureserver.net`
- **SMTP Port:** `587` (TLS) or `465` (SSL)
- **Username:** Your full email address (e.g., `orders@yourdomain.com`)
- **Password:** Your email account password
- **Security:** TLS/SSL required

### For Microsoft 365 Email:
- **SMTP Server:** `smtp.office365.com`
- **SMTP Port:** `587`
- **Username:** Your full email address (e.g., `orders@yourdomain.com`)
- **Password:** Your email account password
- **Security:** STARTTLS

## Step 4: Alternative Method - Check Email Client Setup Instructions

1. In GoDaddy, go to **My Products** → **Email**
2. Look for **Email Client Setup** or **Configure Email Client**
3. Select your email client (e.g., Outlook, Apple Mail)
4. The setup instructions will show your SMTP settings

## Step 5: Update Your .env File

Once you have the credentials, update your `.env` file:

```env
# For GoDaddy Workspace Email
SMTP_HOST=smtpout.secureserver.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=orders@yourdomain.com
SMTP_PASSWORD=your-email-password
SMTP_FROM_EMAIL=orders@yourdomain.com

# OR for Microsoft 365
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=orders@yourdomain.com
SMTP_PASSWORD=your-email-password
SMTP_FROM_EMAIL=orders@yourdomain.com
```

## Important Notes

1. **Password**: Use the password for your email account, not your GoDaddy account password
2. **Port 465 vs 587**: 
   - Port 587 (TLS) - Set `SMTP_SECURE=false`
   - Port 465 (SSL) - Set `SMTP_SECURE=true`
3. **Username**: Must be your full email address, not just the username part
4. **Security**: Never commit your password to git - keep it in `.env` only

## Troubleshooting

If you can't find the settings:
1. Contact GoDaddy support and ask for "SMTP server settings for email client configuration"
2. Check your email welcome email - it often contains these settings
3. Look in your email account settings in the GoDaddy control panel

## Testing Your Settings

After updating `.env`, restart your dev server and try:
- Placing a test order (should send receipt email)
- Requesting a password reset (should send reset email)
