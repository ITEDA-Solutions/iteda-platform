#!/bin/bash

# Script to completely clear Next.js cache and restart dev server
# This fixes persistent caching issues

echo "🧹 Clearing Next.js cache..."
rm -rf .next

echo "🧹 Clearing node_modules cache..."
rm -rf node_modules/.cache

echo "✅ Cache cleared!"
echo ""
echo "Now run:"
echo "  npm run dev"
echo ""
echo "Then hard refresh your browser (Ctrl+Shift+R)"
