# Sender.net Email Setup Guide

This guide will help you set up Sender.net for sending order confirmation emails in your Hooligans application.

## Prerequisites

- A Sender.net account (sign up at [sender.net](https://sender.net))
- Your sending domain verified in Sender
- Access to your domain's DNS settings

## Step 1: Create a Sender.net Account

1. Go to [sender.net](https://sender.net) and sign up for an account
2. Choose a plan that includes transactional email features

## Step 2: Verify Your Sending Domain

1. Log in to your Sender.net account
2. Navigate to **Settings** → **Domains**
3. Add your domain (e.g., `hooligans.com.au`)
4. Follow the instructions to add DNS records:
   - **SPF Record**: Add a TXT record to verify you're authorized to send emails
   - **DKIM Record**: Add a TXT record for email authentication
   - **DMARC Record**: Add a TXT record for email policy
5. Wait for DNS propagation (can take up to 48 hours, but usually much faster)
6. Verify the domain in Sender

## Step 3: Generate an API Token

1. In your Sender account, go to **Settings** → **API Access Tokens**
2. Click **Create New Token**
3. Give it a name (e.g., "Hooligans Production")
4. Set the validation period to **Forever** (or your preferred duration)
5. Copy the generated API token - you'll need this for your environment variables

## Step 4: Configure Environment Variables

Add the following variables to your `.env.local` file:

```bash
# Sender.net Configuration
SENDER_API_TOKEN=your_api_token_from_step_3
SENDER_FROM_EMAIL=orders@hooligans.com.au
SENDER_FROM_NAME=Hooligans
```

Replace:
- `your_api_token_from_step_3` with the actual API token from Step 3
- `orders@hooligans.com.au` with your verified email address
- `Hooligans` with your preferred sender name

## Step 5: Test the Integration

### Option 1: Test via API Route

Create a test file to verify the integration:

```typescript
// scripts/test-sender.ts
import { sendOrderConfirmationViaSender } from '@/lib/sender';

async function testSender() {
  const result = await sendOrderConfirmationViaSender({
    to: 'your-email@example.com', // Replace with your email
    orderNumber: '#TEST-001',
    customerName: 'Test Customer',
  });
  
  console.log('Result:', result);
}

testSender();
```

Run the test:
```bash
npx tsx scripts/test-sender.ts
```

### Option 2: Test via Real Order

1. Start your development server: `npm run dev`
2. Place a test order through your application
3. Complete the payment
4. Check your email inbox for the order confirmation
5. Check the Sender.net dashboard for email analytics

## Step 6: Monitor Email Delivery

1. Log in to your Sender.net dashboard
2. Navigate to **Analytics** → **Transactional Emails**
3. Monitor:
   - Delivery rates
   - Open rates
   - Click rates
   - Bounce rates
   - Spam complaints

## Troubleshooting

### Emails Not Sending

1. **Check API Token**: Ensure `SENDER_API_TOKEN` is set correctly in `.env.local`
2. **Verify Domain**: Make sure your sending domain is verified in Sender
3. **Check Logs**: Look for error messages in your application logs
4. **Test API Token**: Use the Sender API documentation to test your token directly

### Emails Going to Spam

1. **Verify DNS Records**: Ensure SPF, DKIM, and DMARC records are properly configured
2. **Warm Up Domain**: Gradually increase email volume if using a new domain
3. **Check Content**: Avoid spam trigger words and ensure proper HTML formatting
4. **Monitor Reputation**: Check your domain's sender reputation

### Fallback to SMTP

If Sender is not configured or fails, the application will automatically fall back to SMTP email sending. Ensure your SMTP credentials are also configured:

```bash
SMTP_HOST=smtp.example.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=your_email@example.com
SMTP_PASSWORD=your_smtp_password
SMTP_FROM_EMAIL=orders@hooligans.com.au
```

## API Rate Limits

Sender.net has rate limits based on your plan:
- **Free Plan**: Limited sends per month
- **Paid Plans**: Higher limits based on your subscription

Check your plan details in the Sender dashboard.

## Support

- **Sender.net Documentation**: [api.sender.net](https://api.sender.net)
- **Sender.net Support**: [help.sender.net](https://help.sender.net)
- **Email**: [[email protected]](mailto:[email protected])

## Next Steps

Once Sender is working:
1. Monitor email delivery rates
2. Set up email templates in Sender (optional)
3. Configure webhooks for email events (optional)
4. Add more transactional email types (password reset, etc.)
