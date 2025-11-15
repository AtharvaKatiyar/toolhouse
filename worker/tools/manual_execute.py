#!/usr/bin/env python3
"""Manual test of executeWorkflow transaction"""

from web3 import Web3
import json
import time
import sys

# Connect to Moonbase Alpha
w3 = Web3(Web3.HTTPProvider('https://rpc.api.moonbase.moonbeam.network'))

# Load contracts
with open('abi/ActionExecutor.json') as f:
    executor_abi = json.load(f)['abi']
with open('abi/WorkflowRegistry.json') as f:
    registry_abi = json.load(f)['abi']

executor_addr = '0x1Cb45BceCC3f0CEd2875b49d4f6dd5543B2bD559'
registry_addr = '0x87bb7A86E657f1dDd2e84946545b6686935E3a56'
worker_private_key = open('.env').read().split('WORKER_PRIVATE_KEY=')[1].split('\n')[0].strip()

executor = w3.eth.contract(address=executor_addr, abi=executor_abi)
registry = w3.eth.contract(address=registry_addr, abi=registry_abi)
account = w3.eth.account.from_key(worker_private_key)

print(f"Worker: {account.address}")
print(f"Worker balance: {w3.from_wei(w3.eth.get_balance(account.address), 'ether')} DEV\n")

# Get workflow #3
wf = registry.functions.getWorkflow(3).call()
print(f"Workflow #3:")
print(f"  Owner: {wf[0]}")
print(f"  Active: {wf[7]}")
print(f"  ActionData: {wf[4].hex()}")
print(f"  GasBudget: {w3.from_wei(wf[8], 'ether')} DEV\n")

# Build transaction
workflow_id = 3
new_next_run = int(time.time()) + 300
gas_to_charge = wf[8]  # gasBudget

print("Building transaction...")

# Get current base fee for EIP-1559
latest_block = w3.eth.get_block('latest')
base_fee = latest_block.get('baseFeePerGas', 0)
max_priority_fee = w3.to_wei(2, 'gwei')
max_fee = (base_fee * 2) + max_priority_fee

print(f"Base fee: {w3.from_wei(base_fee, 'gwei')} Gwei")
print(f"Max priority fee: {w3.from_wei(max_priority_fee, 'gwei')} Gwei")
print(f"Max fee: {w3.from_wei(max_fee, 'gwei')} Gwei\n")

tx = executor.functions.executeWorkflow(
    workflow_id,
    wf[4],  # actionData
    new_next_run,
    wf[0],  # owner
    gas_to_charge
).build_transaction({
    'from': account.address,
    'nonce': w3.eth.get_transaction_count(account.address),
    'maxFeePerGas': max_fee,
    'maxPriorityFeePerGas': max_priority_fee,
    'chainId': w3.eth.chain_id,
    'gas': 500000  # Manual gas limit
})

print(f"Transaction: {tx}\n")

# Try to estimate gas
try:
    print("Estimating gas...")
    est = w3.eth.estimate_gas(tx)
    print(f"✅ Gas estimate: {est}\n")
except Exception as e:
    print(f"❌ Gas estimation failed: {e}\n")
    print("Trying to send anyway to get better error...")
    
# Sign and send
try:
    print("Signing transaction...")
    signed_tx = account.sign_transaction(tx)
    
    print("Sending transaction...")
    tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction)
    print(f"Transaction hash: {tx_hash.hex()}")
    
    print("Waiting for receipt...")
    receipt = w3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)
    
    print(f"\n✅ SUCCESS!")
    print(f"Status: {receipt['status']}")
    print(f"Gas used: {receipt['gasUsed']}")
    print(f"Block: {receipt['blockNumber']}")
    
except Exception as e:
    print(f"\n❌ Transaction failed: {e}")
    print(f"Error type: {type(e)}")
    if hasattr(e, 'args'):
        print(f"Args: {e.args}")
