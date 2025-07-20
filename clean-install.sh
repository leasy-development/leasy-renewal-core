#!/bin/bash

echo "🧹 Cleaning up node_modules and lockfiles..."
rm -rf node_modules
rm -f package-lock.json
rm -rf .vite

echo "📦 Installing fresh dependencies..."
npm install

echo "✅ Done. All dependencies freshly installed."


chore: add clean-install script for fresh installs
