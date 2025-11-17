#!/usr/bin/env python3
"""
Fix workflow 14's next_run timestamp
"""
import sys
sys.path.insert(0, 'src')

from services.registry_service import RegistryService
from datetime import datetime, timedelta

# Initialize service
registry_service = RegistryService()

# Get workflow details
workflow = registry_service.get_workflow(14)
print(f"📋 Current Workflow 14 State:")
print(f"  Next Run (current): {workflow['next_run']} ({datetime.fromtimestamp(workflow['next_run']) if workflow['next_run'] > 0 else 'NOT SET'})")
print(f"  Interval: {workflow['interval']} seconds ({workflow['interval']/86400} days)")
print(f"  Active: {workflow['active']}")

# Calculate proper next run time
# Since this is a daily workflow that should have run today, set it to tomorrow
now = datetime.now()
tomorrow = now + timedelta(days=1)
next_run_timestamp = int(tomorrow.timestamp())

print(f"\n🔧 Fixing next_run:")
print(f"  Current time: {now}")
print(f"  New next_run: {tomorrow} (timestamp: {next_run_timestamp})")

# Update the workflow
print(f"\n📤 Sending transaction to fix workflow...")
tx_hash = registry_service.update_workflow_status(14, True)  # This will use the correct next_run now

print(f"✅ Transaction sent: {tx_hash}")
print(f"\n⏳ Waiting for confirmation...")

# Wait a bit and verify
import time
time.sleep(10)

updated_workflow = registry_service.get_workflow(14)
print(f"\n✅ Updated Workflow 14 State:")
print(f"  Next Run: {updated_workflow['next_run']} ({datetime.fromtimestamp(updated_workflow['next_run']) if updated_workflow['next_run'] > 0 else 'NOT SET'})")
