#!/bin/bash

# Clear all existing workflows from the blockchain
# This script deletes workflows 1-4 that were created during testing

BACKEND_URL="http://localhost:8000/api"

echo "🗑️  Clearing Test Workflows..."
echo ""

for i in {1..4}; do
    echo "Deleting workflow #$i..."
    response=$(curl -s -X DELETE "$BACKEND_URL/workflow/$i")
    
    if echo "$response" | grep -q "success"; then
        tx_hash=$(echo "$response" | grep -o '"tx_hash":"[^"]*"' | cut -d'"' -f4)
        echo "✅ Workflow #$i deleted. TX: $tx_hash"
    else
        echo "❌ Failed to delete workflow #$i"
        echo "   Response: $response"
    fi
    
    echo ""
    sleep 2  # Wait between transactions
done

echo "✅ Done! Check your dashboard at http://localhost:3000/dashboard"
