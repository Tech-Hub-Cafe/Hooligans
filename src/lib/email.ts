import * as nodemailer from 'nodemailer';

// Create SMTP transporter for GoDaddy email
const getTransporter = () => {
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT;
  const smtpUser = process.env.SMTP_USER;
  const smtpPassword = process.env.SMTP_PASSWORD;

  if (!smtpHost || !smtpPort || !smtpUser || !smtpPassword) {
    return null;
  }

  const port = parseInt(smtpPort, 10);
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;

  return nodemailer.createTransport({
    host: smtpHost,
    port: port,
    secure: secure, // true for 465, false for other ports
    auth: {
      user: smtpUser,
      pass: smtpPassword,
    },
  });
};

const transporter = getTransporter();

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
  if (!transporter) {
    console.warn('[Email] SMTP not configured, skipping receipt email');
    return null;
  }

  try {
    const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || 'orders@hooligans.com.au';
    const info = await transporter.sendMail({
      from: fromEmail,
      to: to,
      subject: `Receipt for Order ${orderNumber}`,
      html: generateReceiptHTML({ orderNumber, items, total, customerName }),
    });

    console.log('[Email] Receipt sent successfully:', info.messageId);
    return { id: info.messageId, messageId: info.messageId };
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
  if (!transporter) {
    console.warn('[Email] SMTP not configured, skipping confirmation email');
    return null;
  }

  try {
    const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || 'orders@hooligans.com.au';
    const info = await transporter.sendMail({
      from: fromEmail,
      to: to,
      subject: `Order Confirmation - ${orderNumber}`,
      html: generateConfirmationHTML({ orderNumber, customerName }),
    });

    console.log('[Email] Confirmation sent successfully:', info.messageId);
    return { id: info.messageId, messageId: info.messageId };
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
  if (!transporter) {
    console.warn('[Email] SMTP not configured, skipping password reset email');
    return null;
  }

  try {
    const resetUrl = `${process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/reset-password?token=${resetToken}`;
    const displayName = userName || 'there';
    const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || 'noreply@hooligans.com.au';

    const info = await transporter.sendMail({
      from: fromEmail,
      to: to,
      subject: 'Reset Your Password - Hooligans',
      html: generatePasswordResetHTML({ resetUrl, displayName }),
    });

    console.log('[Email] Password reset email sent successfully:', info.messageId);
    return { id: info.messageId, messageId: info.messageId };
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

export async function sendContactConfirmation({
  to,
  name,
}: {
  to: string;
  name: string;
}) {
  if (!transporter) {
    console.warn('[Email] SMTP not configured, skipping contact confirmation email');
    return null;
  }

  try {
    const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || 'noreply@hooligans.com.au';
    const info = await transporter.sendMail({
      from: fromEmail,
      to: to,
      subject: 'Thank you for contacting Hooligans',
      html: generateContactConfirmationHTML({ name }),
    });

    console.log('[Email] Contact confirmation sent successfully:', info.messageId);
    return { id: info.messageId, messageId: info.messageId };
  } catch (error) {
    console.error('[Email] Failed to send contact confirmation:', error);
    throw error;
  }
}

export async function sendContactNotification({
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
  if (!transporter) {
    console.warn('[Email] SMTP not configured, skipping contact notification email');
    return null;
  }

  try {
    const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || 'noreply@hooligans.com.au';
    const info = await transporter.sendMail({
      from: fromEmail,
      to: to,
      subject: `New Contact Form Message: ${subject}`,
      html: generateContactNotificationHTML({ name, email, subject, message }),
      replyTo: email,
    });

    console.log('[Email] Contact notification sent successfully:', info.messageId);
    return { id: info.messageId, messageId: info.messageId };
  } catch (error) {
    console.error('[Email] Failed to send contact notification:', error);
    throw error;
  }
}

// Helper function to generate contact confirmation HTML
function generateContactConfirmationHTML({
  name,
}: {
  name: string;
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
          <h1 style="margin: 0; font-size: 28px;">Thank You for Contacting Us</h1>
        </div>
        
        <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
          <p style="font-size: 16px; margin-bottom: 24px;">Hi ${name},</p>
          <p style="font-size: 16px; margin-bottom: 24px;">Thank you for reaching out to Hooligans! We've received your message and will get back to you as soon as possible.</p>
          
          <p style="font-size: 16px; margin-bottom: 24px;">We typically respond within 24 hours during business hours.</p>
          
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

// Helper function to generate contact notification HTML
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
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
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
            <div style="background: #f3f4f6; padding: 16px; border-radius: 6px; white-space: pre-wrap; font-size: 15px;">
${message}
            </div>
          </div>
          
          <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
            <p style="font-size: 14px; color: #666; margin: 0;">
              You can reply directly to this email to respond to ${name}.
            </p>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 24px; font-size: 12px; color: #999;">
          <p>Hooligans - Fresh food, great coffee</p>
        </div>
      </body>
    </html>
  `;
}
