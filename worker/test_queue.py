#!/usr/bin/env python3
"""
Quick test script to verify Redis queue system works
Run this before starting the full scheduler/worker
"""

import json
import time
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.utils.queue import JobQueue
from src.utils.logger import logger

def test_queue():
    """Test basic queue operations"""
    print("🧪 Testing Redis Queue System")
    print("=" * 50)
    
    try:
        queue = JobQueue()
        print("✅ Connected to Redis")
    except Exception as e:
        print(f"❌ Failed to connect to Redis: {e}")
        print("💡 Make sure Redis is running: redis-cli ping")
        return False
    
    # Test 1: Push job
    print("\n📥 Test 1: Pushing job to queue...")
    test_job = {
        "workflowId": 999,
        "owner": "0x1234567890123456789012345678901234567890",
        "actionData": "deadbeef",
        "gasBudget": 100000,
        "retryCount": 0
    }
    
    try:
        queue.push_job(test_job)
        print("✅ Job pushed successfully")
    except Exception as e:
        print(f"❌ Failed to push job: {e}")
        return False
    
    # Test 2: Check queue length
    print("\n📊 Test 2: Checking queue length...")
    try:
        length = queue.queue_length()
        print(f"✅ Queue length: {length}")
    except Exception as e:
        print(f"❌ Failed to check queue: {e}")
        return False
    
    # Test 3: Pop job
    print("\n📤 Test 3: Popping job from queue...")
    try:
        popped_job = queue.pop_job()
        if popped_job:
            print("✅ Job popped successfully:")
            print(f"   Workflow ID: {popped_job['workflowId']}")
            print(f"   Owner: {popped_job['owner']}")
            print(f"   Gas Budget: {popped_job['gasBudget']}")
        else:
            print("⚠️  No job in queue (this is OK if queue was empty)")
    except Exception as e:
        print(f"❌ Failed to pop job: {e}")
        return False
    
    # Test 4: Performance test
    print("\n⚡ Test 4: Performance test (100 jobs)...")
    start = time.time()
    for i in range(100):
        queue.push_job({**test_job, "workflowId": i})
    push_time = time.time() - start
    print(f"✅ Pushed 100 jobs in {push_time:.3f}s ({100/push_time:.0f} jobs/sec)")
    
    start = time.time()
    for i in range(100):
        queue.pop_job()
    pop_time = time.time() - start
    print(f"✅ Popped 100 jobs in {pop_time:.3f}s ({100/pop_time:.0f} jobs/sec)")
    
    print("\n" + "=" * 50)
    print("🎉 All tests passed!")
    print("\n📝 Next steps:")
    print("   1. Terminal 1: python -m src.main scheduler")
    print("   2. Terminal 2: python -m src.main worker")
    return True

if __name__ == "__main__":
    try:
        success = test_queue()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n✋ Test interrupted")
        sys.exit(1)
    except Exception as e:
        print(f"\n💥 Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
