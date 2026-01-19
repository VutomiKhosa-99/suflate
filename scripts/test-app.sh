#!/bin/bash

# Test Suflate Application Script
# This script helps test the application before Epic 2 (Auth & Workspace) is complete

echo "🧪 Suflate Testing Script"
echo "========================="
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "❌ Error: .env.local file not found"
    echo "Please create .env.local with required environment variables"
    exit 1
fi

echo "✅ .env.local file found"
echo ""

# Check required environment variables
echo "Checking environment variables..."
source .env.local

REQUIRED_VARS=(
    "NEXT_PUBLIC_SUPABASE_URL"
    "NEXT_PUBLIC_SUPABASE_ANON_KEY"
    "ASSEMBLYAI_API_KEY"
    "OPENROUTER_API_KEY"
)

MISSING_VARS=()

for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        MISSING_VARS+=("$var")
    fi
done

if [ ${#MISSING_VARS[@]} -gt 0 ]; then
    echo "❌ Missing required environment variables:"
    for var in "${MISSING_VARS[@]}"; do
        echo "   - $var"
    done
    exit 1
fi

echo "✅ All required environment variables are set"
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

echo ""
echo "🚀 Starting development server..."
echo "   Visit http://localhost:3000 to test the app"
echo "   Visit http://localhost:3000/api/test-auth to check auth status"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

npm run dev
