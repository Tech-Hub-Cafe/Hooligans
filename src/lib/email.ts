import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

export async function sendReceipt({
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
  if (!resend) {
    console.warn('[Email] Resend not configured, skipping receipt email');
    return null;
  }

  try {
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'orders@hooligans.com.au',
      to: [to],
      subject: `Receipt for Order ${orderNumber}`,
      html: generateReceiptHTML({ orderNumber, items, total, customerName }),
    });

    if (error) {
      console.error('[Email] Receipt send error:', error);
      throw error;
    }

    console.log('[Email] Receipt sent successfully:', data);
    return data;
  } catch (error) {
    console.error('[Email] Failed to send receipt:', error);
    throw error;
  }
}

export async function sendOrderConfirmation({
  to,
  orderNumber,
  customerName,
}: {
  to: string;
  orderNumber: string;
  customerName: string;
}) {
  if (!resend) {
    console.warn('[Email] Resend not configured, skipping confirmation email');
    return null;
  }

  try {
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'orders@hooligans.com.au',
      to: [to],
      subject: `Order Confirmation - ${orderNumber}`,
      html: generateConfirmationHTML({ orderNumber, customerName }),
    });

    if (error) {
      console.error('[Email] Confirmation send error:', error);
      throw error;
    }

    console.log('[Email] Confirmation sent successfully:', data);
    return data;
  } catch (error) {
    console.error('[Email] Failed to send confirmation:', error);
    throw error;
  }
}

export async function sendPasswordResetEmail({
  to,
  resetToken,
  userName,
}: {
  to: string;
  resetToken: string;
  userName?: string | null;
}) {
  if (!resend) {
    console.warn('[Email] Resend not configured, skipping password reset email');
    return null;
  }

  try {
    const resetUrl = `${process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/reset-password?token=${resetToken}`;
    const displayName = userName || 'there';

    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'noreply@hooligans.com.au',
      to: [to],
      subject: 'Reset Your Password - Hooligans',
      html: generatePasswordResetHTML({ resetUrl, displayName }),
    });

    if (error) {
      console.error('[Email] Password reset send error:', error);
      throw error;
    }

    console.log('[Email] Password reset email sent successfully:', data);
    return data;
  } catch (error) {
    console.error('[Email] Failed to send password reset email:', error);
    throw error;
  }
}

// Helper function to generate password reset HTML
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
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
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
          
          <p style="font-size: 14px; color: #666; margin-top: 32px;">
            If the button doesn't work, copy and paste this link into your browser:
          </p>
          <p style="font-size: 12px; color: #999; word-break: break-all; background: #f3f4f6; padding: 12px; border-radius: 4px;">
            ${resetUrl}
          </p>
          
          <p style="font-size: 14px; color: #666; margin-top: 24px;">
            This link will expire in 1 hour. If you didn't request a password reset, please ignore this email.
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
