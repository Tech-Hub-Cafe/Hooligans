// Debug script to check Sender configuration
import { config } from 'dotenv';
import { resolve } from 'path';
import { existsSync } from 'fs';

// Try .env.local first, then .env
const envLocalPath = resolve(__dirname, '../.env.local');
const envPath = resolve(__dirname, '../.env');
const envFile = existsSync(envLocalPath) ? envLocalPath : envPath;
config({ path: envFile });

console.log('🔍 Sender Configuration Debug\n');
console.log('Environment file:', envFile);
console.log('---');

const token = process.env.SENDER_API_TOKEN;
const fromEmail = process.env.SENDER_FROM_EMAIL;
const fromName = process.env.SENDER_FROM_NAME;

console.log('SENDER_API_TOKEN exists:', !!token);
console.log('SENDER_API_TOKEN length:', token?.length || 0);
console.log('SENDER_API_TOKEN first 20 chars:', token?.substring(0, 20) || 'N/A');
console.log('SENDER_API_TOKEN last 20 chars:', token?.substring(token.length - 20) || 'N/A');
console.log('---');
console.log('SENDER_FROM_EMAIL:', fromEmail || 'NOT SET');
console.log('SENDER_FROM_NAME:', fromName || 'NOT SET');
console.log('---');

// Test API call
console.log('\n🧪 Testing API call...\n');

async function testAPI() {
    try {
        const response = await fetch('https://api.sender.net/v2/message/send', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
                from: {
                    email: fromEmail,
                    name: fromName,
                },
                to: [
                    {
                        email: 'nickyshah534@gmail.com',
                    },
                ],
                subject: 'Test Email',
                html: '<h1>Test</h1>',
            }),
        });

        const data = await response.json();

        console.log('Response status:', response.status);
        console.log('Response data:', JSON.stringify(data, null, 2));

        if (!response.ok) {
            console.log('\n❌ API call failed');
            console.log('\nPossible issues:');
            console.log('1. Token might be invalid or expired');
            console.log('2. Token might have been copied incorrectly (check for extra spaces/newlines)');
            console.log('3. Domain might not be verified in Sender');
            console.log('4. Token might not have the correct permissions');
            console.log('\n💡 Try:');
            console.log('- Regenerate the API token in Sender settings');
            console.log('- Verify your sending domain in Sender');
            console.log('- Check that the token has "Send transactional emails" permission');
        } else {
            console.log('\n✅ API call successful!');
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

testAPI();
