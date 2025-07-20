#!/bin/bash

# Production-Ready Setup Script for Leasy Renewal Core
# This script ensures all components are properly configured

echo "🚀 Setting up Leasy Renewal Core for production..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if pnpm is available, fallback to npm
if command -v pnpm &> /dev/null; then
    PKG_MANAGER="pnpm"
else
    PKG_MANAGER="npm"
fi

echo "📦 Using package manager: $PKG_MANAGER"

# Install dependencies
echo "📦 Installing dependencies..."
$PKG_MANAGER install

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "⚙️ Creating .env.local from template..."
    cp .env.local.example .env.local
    echo "⚠️ Please update .env.local with your actual API keys"
fi

# Run type checking
echo "🔍 Running type checking..."
$PKG_MANAGER run type-check

# Run linting
echo "🧹 Running ESLint..."
$PKG_MANAGER run lint --fix

# Run tests
echo "🧪 Running tests..."
$PKG_MANAGER run test

# Check Supabase CLI
if command -v supabase &> /dev/null; then
    echo "🗄️ Supabase CLI found. Starting local development..."
    supabase start
else
    echo "⚠️ Supabase CLI not found. Install with: npm i -g supabase"
fi

echo "✅ Setup complete! Run '$PKG_MANAGER run dev' to start development server"
echo "🌐 Production URL: https://leasy-renewal-core.lovable.app"