#!/usr/bin/env python3
"""
Helper script to derive the worker address from WORKER_PRIVATE_KEY in .env

Usage:
    cd /home/mime/Desktop/autometa/worker
    source venv/bin/activate
    python tools/get_worker_address.py
"""
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from web3 import Web3
from src.utils.config import settings

def main():
    print("\n" + "="*60)
    print("🔑 WORKER ADDRESS DERIVATION")
    print("="*60 + "\n")
    
    if not settings.WORKER_PRIVATE_KEY:
        print("❌ ERROR: WORKER_PRIVATE_KEY not set in .env")
        print("   Please set WORKER_PRIVATE_KEY in worker/.env\n")
        sys.exit(1)
    
    # Derive address from private key
    w3 = Web3()
    account = w3.eth.account.from_key(settings.WORKER_PRIVATE_KEY)
    
    print("Worker Address:")
    print(f"   {account.address}")
    print()
    print("Private Key (first 10 chars):")
    print(f"   {settings.WORKER_PRIVATE_KEY[:10]}...")
    print()
    print("="*60)
    print("📋 NEXT STEPS:")
    print("="*60)
    print()
    print("1. Copy the worker address above")
    print()
    print("2. Update contracts/scripts/grant-worker-role.js:")
    print(f"   const WORKER_ADDRESS = \"{account.address}\";")
    print()
    print("3. Run the grant-role script:")
    print("   cd ../contracts")
    print("   npx hardhat run scripts/grant-worker-role.js --network moonbaseAlpha")
    print()
    print("4. Verify worker has WORKER_ROLE:")
    print("   npx hardhat console --network moonbaseAlpha")
    print("   > const executor = await ethers.getContractAt('ActionExecutor', '0x8A791620dd6260079BF849Dc5567aDC3F2FdC318');")
    print(f"   > await executor.hasRole(ethers.keccak256(ethers.toUtf8Bytes('WORKER_ROLE')), '{account.address}');")
    print()

if __name__ == "__main__":
    main()
