/**
 * Sender.net Email Service
 * 
 * Provides functions to send transactional emails via Sender.net API
 * API Documentation: https://api.sender.net
 */

const SENDER_API_BASE = 'https://api.sender.net/v2';

interface SenderEmailParams {
    to: string;
    subject: string;
    html: string;
    from?: {
        email: string;
        name: string;
    };
    replyTo?: string;
}

interface SenderApiResponse {
    success: boolean;
    message?: string;
    errors?: any[];
}

/**
 * Send an email via Sender.net API
 */
async function sendSenderEmail({
    to,
    subject,
    html,
    from,
    replyTo,
}: SenderEmailParams): Promise<SenderApiResponse> {
    const apiToken = process.env.SENDER_API_TOKEN;

    if (!apiToken) {
        console.warn('[Sender] API token not configured, skipping email');
        return { success: false, message: 'API token not configured' };
    }

    const fromEmail = from?.email || process.env.SENDER_FROM_EMAIL || 'orders@hooligans.com.au';
    const fromName = from?.name || process.env.SENDER_FROM_NAME || 'Hooligans';

    const body: Record<string, unknown> = {
        from: {
            email: fromEmail,
            name: fromName,
        },
        to: { email: to },
        subject: subject,
        html: html,
    };
    if (replyTo) body.reply_to = replyTo;

    try {
        const response = await fetch(`${SENDER_API_BASE}/message/send`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiToken}`,
            },
            body: JSON.stringify(body),
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('[Sender] API error:', {
                status: response.status,
                statusText: response.statusText,
                data,
            });
            return {
                success: false,
                message: data.message || `API error: ${response.status}`,
                errors: data.errors,
            };
        }

        console.log('[Sender] Email sent successfully:', {
            to,
            subject,
            response: data,
        });

        return { success: true, ...data };
    } catch (error) {
        console.error('[Sender] Failed to send email:', error);
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

/**
 * Send order confirmation email via Sender
 */
export async function sendOrderConfirmationViaSender({
    to,
    orderNumber,
    customerName,
}: {
    to: string;
    orderNumber: string;
    customerName: string;
}) {
    const subject = `Order Confirmation - ${orderNumber}`;
    const html = generateConfirmationHTML({ orderNumber, customerName });

    return sendSenderEmail({ to, subject, html });
}

/**
 * Send receipt email via Sender
 */
export async function sendReceiptViaSender({
    to,
    orderNumber,
    items,
    total,
    customerName,
}: {
    to: string;
    orderNumber: string;
    items: any[];
    total: number;
    customerName: string;
}) {
    const subject = `Receipt for Order ${orderNumber}`;
    const html = generateReceiptHTML({ orderNumber, items, total, customerName });

    return sendSenderEmail({ to, subject, html });
}

/**
 * Send contact form confirmation to the user via Sender
 */
export async function sendContactConfirmationViaSender({
    to,
    name,
}: {
    to: string;
    name: string;
}) {
    const subject = 'Thank you for contacting Hooligans';
    const html = generateContactConfirmationHTML({ name });
    return sendSenderEmail({ to, subject, html });
}

/**
 * Send contact form notification to admin via Sender
 */
export async function sendContactNotificationViaSender({
    to,
    name,
    email,
    subject,
    message,
}: {
    to: string;
    name: string;
    email: string;
    subject: string;
    message: string;
}) {
    const emailSubject = `New Contact Form Message: ${subject}`;
    const html = generateContactNotificationHTML({ name, email, subject, message });
    return sendSenderEmail({ to, subject: emailSubject, html, replyTo: email });
}

/**
 * Send a test email via Sender (for diagnostics)
 */
export async function sendTestEmailViaSender({ to }: { to: string }) {
    const subject = 'Hooligans – email test';
    const html = `
    <!DOCTYPE html>
    <html>
      <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #14b8a6; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">Email test</h1>
        </div>
        <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
          <p style="font-size: 16px;">If you received this, email from Hooligans is working.</p>
          <p style="font-size: 14px; color: #666;">This message was sent via Sender.</p>
        </div>
        <div style="text-align: center; margin-top: 24px; font-size: 12px; color: #999;"><p>Hooligans</p></div>
      </body>
    </html>
  `;
    return sendSenderEmail({ to, subject, html });
}

/**
 * Send password reset email via Sender
 */
export async function sendPasswordResetViaSender({
    to,
    resetUrl,
    displayName,
}: {
    to: string;
    resetUrl: string;
    displayName: string;
}) {
    const subject = 'Reset Your Password - Hooligans';
    const html = generatePasswordResetHTML({ resetUrl, displayName });
    return sendSenderEmail({ to, subject, html });
}

/**
 * Check if Sender is configured
 */
export function isSenderConfigured(): boolean {
    return !!(
        process.env.SENDER_API_TOKEN &&
        process.env.SENDER_FROM_EMAIL
    );
}

// Helper function to generate confirmation HTML
function generateConfirmationHTML({
    orderNumber,
    customerName,
}: {
    orderNumber: string;
    customerName: string;
}) {
    return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #14b8a6; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">✓ Order Confirmed</h1>
        </div>
        
        <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
          <p style="font-size: 16px; margin-bottom: 24px;">Hi ${customerName},</p>
          <p style="font-size: 16px; margin-bottom: 16px;">Your order has been received and confirmed!</p>
          
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 24px 0; text-align: center;">
            <p style="margin: 0; font-size: 14px; color: #666;">Order Number</p>
            <p style="margin: 8px 0 0 0; font-size: 24px; font-weight: bold; color: #14b8a6;">${orderNumber}</p>
          </div>
          
          <p style="font-size: 16px; margin-bottom: 24px;">We're preparing your order now. We'll let you know when it's ready!</p>
          
          <p style="margin-top: 32px; font-size: 14px; color: #666;">
            Thanks for choosing Hooligans!
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 24px; font-size: 12px; color: #999;">
          <p>Hooligans - Fresh food, great coffee</p>
        </div>
      </body>
    </html>
  `;
}

// Helper function to generate receipt HTML
function generateReceiptHTML({
    orderNumber,
    items,
    total,
    customerName,
}: {
    orderNumber: string;
    items: any[];
    total: number;
    customerName: string;
}) {
    const itemsHTML = items
        .map((item) => {
            const modifiersHTML = item.modifiers
                ? item.modifiers
                    .map(
                        (mod: any) =>
                            `<div style="margin-left: 20px; font-size: 14px; color: #666;">+ ${mod.modifierName} ${mod.modifierPrice > 0 ? `($${mod.modifierPrice.toFixed(2)})` : ''
                            }</div>`
                    )
                    .join('')
                : '';

            return `
        <div style="margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #eee;">
          <div style="display: flex; justify-content: space-between; align-items: start;">
            <div style="flex: 1;">
              <strong>${item.quantity}x ${item.name}</strong>
              ${modifiersHTML}
            </div>
            <div style="font-weight: bold; white-space: nowrap; margin-left: 16px;">
              $${(item.price * item.quantity).toFixed(2)}
            </div>
          </div>
        </div>
      `;
        })
        .join('');

    return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #14b8a6; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">Receipt</h1>
          <p style="margin: 8px 0 0 0; font-size: 18px;">Order ${orderNumber}</p>
        </div>
        
        <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
          <p style="font-size: 16px; margin-bottom: 24px;">Hi ${customerName},</p>
          <p style="font-size: 16px; margin-bottom: 24px;">Thank you for your order! Here's your receipt:</p>
          
          <div style="margin-bottom: 24px;">
            ${itemsHTML}
          </div>
          
          <div style="border-top: 2px solid #333; padding-top: 16px; margin-top: 16px;">
            <div style="display: flex; justify-content: space-between; font-size: 18px; font-weight: bold;">
              <span>Total</span>
              <span>$${total.toFixed(2)}</span>
            </div>
          </div>
          
          <p style="margin-top: 32px; font-size: 14px; color: #666; text-align: center;">
            We'll have your order ready soon!
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 24px; font-size: 12px; color: #999;">
          <p>Hooligans - Fresh food, great coffee</p>
        </div>
      </body>
    </html>
  `;
}

function generateContactConfirmationHTML({ name }: { name: string }) {
    return `
    <!DOCTYPE html>
    <html>
      <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #14b8a6; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">Thank You for Contacting Us</h1>
        </div>
        <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
          <p style="font-size: 16px; margin-bottom: 24px;">Hi ${name},</p>
          <p style="font-size: 16px; margin-bottom: 24px;">Thank you for reaching out to Hooligans! We've received your message and will get back to you as soon as possible.</p>
          <p style="font-size: 16px; margin-bottom: 24px;">We typically respond within 24 hours during business hours.</p>
          <p style="margin-top: 32px; font-size: 14px; color: #666;">Thanks for choosing Hooligans!</p>
        </div>
        <div style="text-align: center; margin-top: 24px; font-size: 12px; color: #999;"><p>Hooligans - Fresh food, great coffee</p></div>
      </body>
    </html>
  `;
}

function generateContactNotificationHTML({
    name,
    email,
    subject,
    message,
}: {
    name: string;
    email: string;
    subject: string;
    message: string;
}) {
    return `
    <!DOCTYPE html>
    <html>
      <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #14b8a6; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">New Contact Form Message</h1>
        </div>
        <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
          <div style="margin-bottom: 24px;">
            <p style="font-size: 14px; color: #666; margin: 0 0 4px 0;"><strong>From:</strong></p>
            <p style="font-size: 16px; margin: 0;">${name} &lt;${email}&gt;</p>
          </div>
          <div style="margin-bottom: 24px;">
            <p style="font-size: 14px; color: #666; margin: 0 0 4px 0;"><strong>Subject:</strong></p>
            <p style="font-size: 16px; margin: 0;">${subject}</p>
          </div>
          <div style="margin-bottom: 24px;">
            <p style="font-size: 14px; color: #666; margin: 0 0 8px 0;"><strong>Message:</strong></p>
            <div style="background: #f3f4f6; padding: 16px; border-radius: 6px; white-space: pre-wrap; font-size: 15px;">${message}</div>
          </div>
          <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
            <p style="font-size: 14px; color: #666; margin: 0;">You can reply directly to this email to respond to ${name}.</p>
          </div>
        </div>
        <div style="text-align: center; margin-top: 24px; font-size: 12px; color: #999;"><p>Hooligans - Fresh food, great coffee</p></div>
      </body>
    </html>
  `;
}

function generatePasswordResetHTML({
    resetUrl,
    displayName,
}: {
    resetUrl: string;
    displayName: string;
}) {
    return `
    <!DOCTYPE html>
    <html>
      <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #14b8a6; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">Reset Your Password</h1>
        </div>
        <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
          <p style="font-size: 16px; margin-bottom: 24px;">Hi ${displayName},</p>
          <p style="font-size: 16px; margin-bottom: 24px;">We received a request to reset your password. Click the button below to create a new password:</p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${resetUrl}" style="display: inline-block; background: #14b8a6; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">Reset Password</a>
          </div>
          <p style="font-size: 14px; color: #666; margin-top: 32px;">If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="font-size: 12px; color: #999; word-break: break-all; background: #f3f4f6; padding: 12px; border-radius: 4px;">${resetUrl}</p>
          <p style="font-size: 14px; color: #666; margin-top: 24px;">This link will expire in 1 hour. If you didn't request a password reset, please ignore this email.</p>
        </div>
        <div style="text-align: center; margin-top: 24px; font-size: 12px; color: #999;"><p>Hooligans - Fresh food, great coffee</p></div>
      </body>
    </html>
  `;
}
