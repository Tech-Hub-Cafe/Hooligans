import twilio from 'twilio';

const client = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
    ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
    : null;

export async function sendOrderConfirmationSMS({
    to,
    orderNumber,
    customerName,
}: {
    to: string;
    orderNumber: string;
    customerName: string;
}) {
    if (!client) {
        console.warn('[SMS] Twilio not configured, skipping SMS');
        return null;
    }

    try {
        const message = await client.messages.create({
            body: `Hi ${customerName}! Your order ${orderNumber} has been confirmed. We'll have it ready soon! - Hooligans`,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: to,
        });

        console.log('[SMS] Confirmation sent successfully:', message.sid);
        return message;
    } catch (error) {
        console.error('[SMS] Failed to send confirmation:', error);
        throw error;
    }
}

export function isSMSConfigured(): boolean {
    return !!(
        process.env.TWILIO_ACCOUNT_SID &&
        process.env.TWILIO_AUTH_TOKEN &&
        process.env.TWILIO_PHONE_NUMBER
    );
}
