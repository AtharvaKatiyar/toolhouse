import json
import time
from pathlib import Path
from web3 import Web3
from web3.exceptions import TransactionNotFound
from ..utils.web3_provider import make_web3
from ..utils.logger import logger
from ..utils.config import settings

class EVMExecutor:
    def __init__(self, web3: Web3 = None):
        self.w3 = web3 or make_web3()
        self.executor_address = settings.ACTIONEXECUTOR_ADDRESS
        
        # Load ActionExecutor ABI from artifact
        abi_path = Path(__file__).parent.parent.parent / "abi" / "ActionExecutor.json"
        try:
            with open(abi_path, 'r') as f:
                artifact = json.load(f)
            
            self.abi = artifact["abi"]
            self.contract = self.w3.eth.contract(
                address=Web3.to_checksum_address(self.executor_address),
                abi=self.abi
            )
            
            # Signer account from worker private key
            if not settings.WORKER_PRIVATE_KEY:
                raise RuntimeError("WORKER_PRIVATE_KEY not set in env")
            
            self.account = self.w3.eth.account.from_key(settings.WORKER_PRIVATE_KEY)
            logger.info(f"EVMExecutor initialized with worker account: {self.account.address}")
        except Exception as e:
            logger.error(f"Failed to initialize EVMExecutor: {e}")
            raise

    def _build_tx(self, workflow_id: int, action_data: bytes, new_next_run: int, user: str, gas_to_charge: int):
        """Build transaction for executeWorkflow call using EIP-1559 format"""
        # Get current base fee for EIP-1559
        latest_block = self.w3.eth.get_block('latest')
        base_fee = latest_block.get('baseFeePerGas', 0)
        
        # Set priority fee and max fee (EIP-1559 format for Moonbeam)
        max_priority_fee = self.w3.to_wei(2, 'gwei')  # 2 Gwei priority
        max_fee = (base_fee * 2) + max_priority_fee  # 2x base + priority
        
        tx = self.contract.functions.executeWorkflow(
            workflow_id,
            action_data,
            new_next_run,
            Web3.to_checksum_address(user),
            int(gas_to_charge)
        ).build_transaction({
            "from": self.account.address,
            "nonce": self.w3.eth.get_transaction_count(self.account.address),
            "maxFeePerGas": max_fee,
            "maxPriorityFeePerGas": max_priority_fee,
            "chainId": self.w3.eth.chain_id
        })
        return tx

    def estimate_gas(self, tx):
        """Estimate gas for transaction with safety buffer"""
        try:
            est = self.w3.eth.estimate_gas(tx)
            return int(est * 1.2)  # 20% safety buffer
        except Exception as e:
            logger.warning(f"Gas estimation failed: {e}")
            return None

    def execute_workflow(
        self, 
        workflow_id: int, 
        action_data: bytes, 
        new_next_run: int, 
        user: str, 
        gas_to_charge: int,
        gas_limit: int = None,
        wait_receipt: bool = True,
        timeout: int = 120
    ):
        """
        Build, sign and send executeWorkflow transaction.
        
        Args:
            workflow_id: Workflow ID from registry
            action_data: Encoded action data (bytes)
            new_next_run: Next scheduled run timestamp
            user: Workflow owner address
            gas_to_charge: Gas budget to charge from FeeEscrow
            gas_limit: Optional gas limit override
            wait_receipt: Whether to wait for receipt (default True)
            timeout: Receipt wait timeout in seconds (default 120)
            
        Returns:
            tx_hash (hex string) if wait_receipt=False, otherwise receipt object
        """
        try:
            # Build transaction
            tx = self._build_tx(workflow_id, action_data, new_next_run, user, gas_to_charge)
            
            # Estimate gas if not provided
            if gas_limit is None:
                est = self.estimate_gas(tx)
                if est:
                    tx['gas'] = est
                else:
                    # Fallback gas limit if estimation fails
                    tx['gas'] = 500000
            else:
                tx['gas'] = gas_limit
            
            # Sign transaction
            signed = self.account.sign_transaction(tx)
            
            # Send transaction
            tx_hash = self.w3.eth.send_raw_transaction(signed.raw_transaction)
            tx_hex = tx_hash.hex()
            logger.info(f"📤 Sent executeWorkflow tx {tx_hex} for workflow #{workflow_id}")
            
            if not wait_receipt:
                return tx_hex
            
            # Wait for receipt with timeout
            start = time.time()
            while time.time() - start < timeout:
                try:
                    receipt = self.w3.eth.get_transaction_receipt(tx_hash)
                    if receipt:
                        if receipt['status'] == 1:
                            logger.info(f"✅ Workflow #{workflow_id} executed successfully (tx: {tx_hex})")
                        else:
                            logger.error(f"❌ Workflow #{workflow_id} execution reverted (tx: {tx_hex})")
                        return receipt
                except TransactionNotFound:
                    time.sleep(2)
            
            logger.warning(f"⏱️ Timeout waiting for tx {tx_hex} receipt")
            return tx_hex
            
        except Exception as e:
            logger.error(f"❌ Failed to execute workflow #{workflow_id}: {e}")
            raise
