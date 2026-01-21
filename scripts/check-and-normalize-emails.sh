#!/bin/bash

# Script to check for running dev server and normalize emails

echo "🔍 Checking for running development server..."

# Check if Next.js dev server is running
if pgrep -f "next dev" > /dev/null || pgrep -f "npm run dev" > /dev/null || pgrep -f "node.*next" > /dev/null; then
    echo "⚠️  WARNING: Development server appears to be running!"
    echo ""
    echo "Please stop the dev server first:"
    echo "  1. Find the terminal where 'npm run dev' is running"
    echo "  2. Press Ctrl+C to stop it"
    echo "  3. Wait 10-30 seconds for database connections to close"
    echo "  4. Then run this script again"
    echo ""
    read -p "Have you stopped the dev server? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Please stop the dev server first and try again."
        exit 1
    fi
    echo "⏳ Waiting 15 seconds for connections to close..."
    sleep 15
else
    echo "✅ No development server detected"
fi

echo ""
echo "🚀 Running email normalization script..."
echo ""

npx tsx scripts/normalize-existing-emails.ts
