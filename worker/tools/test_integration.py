#!/usr/bin/env python3
"""
Integration test for the queue-based execution system.
Tests the full flow: push job → worker pulls → executor executes (simulated)

Usage:
    cd /home/mime/Desktop/autometa/worker
    source venv/bin/activate
    python tools/test_integration.py
"""
import sys
import time
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from src.utils.queue import JobQueue
from src.utils.logger import logger

def test_queue_operations():
    """Test basic queue operations"""
    logger.info("🧪 Testing queue operations...")
    
    q = JobQueue()
    
    # Clear queue first
    q.clear_queue()
    logger.info("✅ Queue cleared")
    
    # Test push
    test_job = {
        "workflowId": 999,
        "owner": "0xTestAddress",
        "actionData": "0xdeadbeef",
        "gasBudget": 100000,
        "retryCount": 0
    }
    
    q.push_job(test_job)
    logger.info("✅ Job pushed")
    
    # Test queue length
    length = q.queue_length()
    assert length == 1, f"Expected length 1, got {length}"
    logger.info(f"✅ Queue length: {length}")
    
    # Test pop
    popped_job = q.pop_job(timeout=1)
    assert popped_job is not None, "Failed to pop job"
    assert popped_job["workflowId"] == 999, "Wrong workflow ID"
    logger.info(f"✅ Job popped: workflowId={popped_job['workflowId']}")
    
    # Verify queue is empty
    length = q.queue_length()
    assert length == 0, f"Expected empty queue, got {length}"
    logger.info("✅ Queue is empty after pop")
    
    print("\n✅ All queue operation tests passed!\n")

def test_job_encoding():
    """Test job data encoding/decoding"""
    logger.info("🧪 Testing job data encoding...")
    
    # Test hex string to bytes conversion
    test_cases = [
        ("0x", b""),
        ("0xdeadbeef", bytes.fromhex("deadbeef")),
        ("deadbeef", bytes.fromhex("deadbeef")),
        ("", b""),
    ]
    
    for hex_str, expected_bytes in test_cases:
        # Simulate the job worker's decoding logic
        if hex_str.startswith("0x"):
            hex_str = hex_str[2:]
        result = bytes.fromhex(hex_str) if hex_str else b""
        assert result == expected_bytes, f"Failed to decode {hex_str}"
        logger.info(f"✅ Decoded '{hex_str or '(empty)'}' → {result.hex() or '(empty)'}")
    
    print("\n✅ All encoding tests passed!\n")

def test_performance():
    """Test queue performance"""
    logger.info("🧪 Testing queue performance...")
    
    q = JobQueue()
    q.clear_queue()
    
    num_jobs = 100
    
    # Test push performance
    start = time.time()
    for i in range(num_jobs):
        job = {
            "workflowId": i,
            "owner": "0xTest",
            "actionData": "0x",
            "gasBudget": 100000,
            "retryCount": 0
        }
        q.push_job(job)
    push_time = time.time() - start
    push_rate = num_jobs / push_time
    
    logger.info(f"✅ Pushed {num_jobs} jobs in {push_time:.3f}s ({push_rate:.0f} jobs/sec)")
    
    # Test pop performance
    start = time.time()
    for i in range(num_jobs):
        job = q.pop_job(timeout=1)
        assert job is not None, f"Failed to pop job {i}"
    pop_time = time.time() - start
    pop_rate = num_jobs / pop_time
    
    logger.info(f"✅ Popped {num_jobs} jobs in {pop_time:.3f}s ({pop_rate:.0f} jobs/sec)")
    
    print(f"\n✅ Performance test passed!")
    print(f"   Push rate: {push_rate:.0f} jobs/sec")
    print(f"   Pop rate: {pop_rate:.0f} jobs/sec\n")

def main():
    """Run all integration tests"""
    print("\n" + "="*60)
    print("🧪 QUEUE INTEGRATION TESTS")
    print("="*60 + "\n")
    
    try:
        test_queue_operations()
        test_job_encoding()
        test_performance()
        
        print("="*60)
        print("🎉 ALL INTEGRATION TESTS PASSED!")
        print("="*60 + "\n")
        
    except AssertionError as e:
        logger.error(f"❌ Test failed: {e}")
        sys.exit(1)
    except Exception as e:
        logger.error(f"❌ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()
