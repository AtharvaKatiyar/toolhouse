#!/usr/bin/env python3
"""
Test script to manually push a test job to the Redis queue.
This is useful for testing the job worker without needing a full workflow on-chain.

Usage:
    cd /home/mime/Desktop/autometa/worker
    source venv/bin/activate
    python tools/push_test_job.py
"""
import sys
import json
import time
from pathlib import Path

# Add parent directory to path so we can import from src
sys.path.insert(0, str(Path(__file__).parent.parent))

from src.utils.queue import JobQueue
from src.utils.logger import logger

def push_test_job():
    """Push a test job to the Redis queue"""
    
    logger.info("🧪 Pushing test job to Redis queue...")
    
    # Initialize queue
    q = JobQueue()
    
    # Example test job - modify these values to match your deployed workflow
    # NOTE: Make sure you have a workflow with ID=1 created on-chain, or change workflowId
    job = {
        "workflowId": 1,
        "owner": "0x1234567890123456789012345678901234567890",  # Replace with actual workflow owner
        "triggerType": 1,  # TimeTrigger
        "actionType": 1,   # Transfer action
        "actionData": "0x",  # Empty data for testing, or use encoded transfer data
        "nextRun": int(time.time()),
        "gasBudget": 100000000000000000,  # 0.1 DEV (in wei)
        "interval": 60,  # Reschedule in 60 seconds
        "retryCount": 0
    }
    
    # Push job to queue
    q.push_job(job)
    
    logger.info("✅ Test job pushed successfully!")
    logger.info(f"   Workflow ID: {job['workflowId']}")
    logger.info(f"   Owner: {job['owner']}")
    logger.info(f"   Gas Budget: {job['gasBudget']} wei")
    logger.info(f"   Queue length: {q.queue_length()}")
    
    print("\n" + "="*60)
    print("📋 JOB DETAILS:")
    print("="*60)
    print(json.dumps(job, indent=2))
    print("="*60)
    print("\n✅ Job is now in the queue!")
    print("   Run the worker to process it:")
    print("   python -m src.main worker\n")

if __name__ == "__main__":
    try:
        push_test_job()
    except Exception as e:
        logger.error(f"❌ Failed to push test job: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
