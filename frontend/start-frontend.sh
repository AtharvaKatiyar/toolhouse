#!/bin/bash

# Autometa Frontend - Quick Start Script

echo "🚀 Starting Autometa Frontend..."
echo ""

# Check if in correct directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found"
    echo "Please run this script from the frontend directory:"
    echo "  cd /home/mime/Desktop/autometa/frontend"
    echo "  ./start-frontend.sh"
    exit 1
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
fi

# Start development server
echo "🌐 Starting Next.js development server..."
echo "   Frontend will be available at: http://localhost:3000"
echo "   Press Ctrl+C to stop"
echo ""

npm run dev
