// Load environment variables
import { config } from 'dotenv';
import { resolve } from 'path';
import { existsSync } from 'fs';

// Try .env.local first, then .env
const envLocalPath = resolve(__dirname, '../.env.local');
const envPath = resolve(__dirname, '../.env');
const envFile = existsSync(envLocalPath) ? envLocalPath : envPath;
config({ path: envFile });

console.log(`📁 Loading environment from: ${envFile}`);

import { sendOrderConfirmationViaSender, sendReceiptViaSender } from '../src/lib/sender';

async function testSender() {
    console.log('🧪 Testing Sender.net Integration...\n');

    // Test 1: Order Confirmation
    console.log('📧 Test 1: Sending Order Confirmation...');
    try {
        const confirmationResult = await sendOrderConfirmationViaSender({
            to: 'nickyshah534@gmail.com',
            orderNumber: '#TEST-001',
            customerName: 'Test Customer',
        });

        if (confirmationResult.success) {
            console.log('✅ Order confirmation sent successfully!');
            console.log('Response:', confirmationResult);
        } else {
            console.log('❌ Order confirmation failed:');
            console.log('Error:', confirmationResult.message);
        }
    } catch (error) {
        console.error('❌ Order confirmation error:', error);
    }

    console.log('\n---\n');

    // Test 2: Receipt Email
    console.log('📧 Test 2: Sending Receipt...');
    try {
        const receiptResult = await sendReceiptViaSender({
            to: 'nickyshah534@gmail.com',
            orderNumber: '#TEST-001',
            customerName: 'Test Customer',
            total: 25.50,
            items: [
                {
                    name: 'Flat White',
                    quantity: 2,
                    price: 5.00,
                    modifiers: [
                        { modifierName: 'Extra Shot', modifierPrice: 1.00 },
                    ],
                },
                {
                    name: 'Avocado Toast',
                    quantity: 1,
                    price: 14.50,
                    modifiers: [],
                },
            ],
        });

        if (receiptResult.success) {
            console.log('✅ Receipt sent successfully!');
            console.log('Response:', receiptResult);
        } else {
            console.log('❌ Receipt failed:');
            console.log('Error:', receiptResult.message);
        }
    } catch (error) {
        console.error('❌ Receipt error:', error);
    }

    console.log('\n✨ Testing complete!\n');
    console.log('📊 Check your email inbox and Sender.net dashboard for results.');
}

// Run the test
testSender().catch(console.error);
