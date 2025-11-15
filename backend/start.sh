#!/bin/bash
# Start Autometa Backend API

# Navigate to backend directory
cd "$(dirname "$0")"

# Activate virtual environment
source venv/bin/activate

# Set Python path
export PYTHONPATH="${PYTHONPATH}:$(pwd)"

# Start FastAPI server with uvicorn
echo "Starting Autometa Backend API on http://localhost:8000"
echo "Docs available at http://localhost:8000/docs"
echo ""

uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload
