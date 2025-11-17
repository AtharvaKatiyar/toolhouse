"""
Job Worker - Consumes jobs from Redis queue and executes workflows on-chain
"""
import time
import traceback
from web3 import Web3
from ..utils.queue import JobQueue
from ..utils.logger import logger
from ..utils.web3_provider import make_web3
from ..utils.config import settings
from .evm_executor import EVMExecutor

class JobWorker:
    """Worker that processes jobs from the Redis queue and executes workflows on-chain"""
    
    def __init__(self):
        self.queue = JobQueue()
        self.w3 = make_web3()
        self.executor = EVMExecutor(self.w3)
        self.max_retries = 3
        self.retry_delay = 2  # Base delay in seconds
        self.running = False

    def start(self):
        """Start the job worker loop - pulls jobs from Redis and executes them"""
        self.running = True
        logger.info("🚀 Job Worker started")
        logger.info(f"Connected to Moonbase: {self.w3.is_connected()}")
        logger.info(f"Worker address: {self.executor.account.address}")
        
        while self.running:
            try:
                # Pop job from queue (blocking with 5s timeout)
                job = self.queue.pop_job(timeout=5)
                
                if not job:
                    # No job available, continue polling
                    continue

                # Process the job
                self._process_job(job)
                
            except KeyboardInterrupt:
                logger.info("⏹️  Job Worker stopped by user")
                self.running = False
                break
            except Exception as e:
                logger.error(f"❌ Unhandled worker error: {e}")
                logger.debug(traceback.format_exc())
                time.sleep(2)

    def stop(self):
        """Stop the job worker gracefully"""
        self.running = False
        logger.info("⏹️  Job Worker stopping...")

    def _process_job(self, job: dict):
        """
        Process a single job from the queue.
        Decodes action data, calls executor, handles retries.
        """
        workflow_id = int(job["workflowId"])
        owner = job.get("owner")
        action_data_raw = job.get("actionData", "")
        gas_budget = int(job.get("gasBudget", 0) or 0)
        retry_count = int(job.get("retryCount", 0))
        
        # CHECK ESCROW BALANCE BEFORE EXECUTION
        try:
            import os
            import requests
            backend_url = os.getenv("BACKEND_API_URL", "http://localhost:8000/api")
            balance_response = requests.get(f"{backend_url}/escrow/balance/{owner}", timeout=5)
            if balance_response.status_code == 200:
                balance_data = balance_response.json()
                current_balance = int(balance_data.get("balance", 0))
                
                if current_balance < gas_budget:
                    logger.warning(f"⚠️  SKIPPING workflow #{workflow_id} - insufficient escrow balance")
                    logger.warning(f"   Owner: {owner}")
                    logger.warning(f"   Balance: {self.w3.from_wei(current_balance, 'ether')} DEV")
                    logger.warning(f"   Required: {self.w3.from_wei(gas_budget, 'ether')} DEV")
                    logger.warning(f"   Shortfall: {self.w3.from_wei(gas_budget - current_balance, 'ether')} DEV")
                    return  # Skip execution, don't re-enqueue
        except Exception as e:
            logger.warning(f"⚠️  Could not check balance for workflow #{workflow_id}: {e}")
            # Continue with execution if balance check fails (fail-safe)
        
        # Decode action data from hex string to bytes
        if isinstance(action_data_raw, str):
            # Remove 0x prefix if present
            if action_data_raw.startswith("0x"):
                action_data_raw = action_data_raw[2:]
            action_bytes = bytes.fromhex(action_data_raw) if action_data_raw else b""
        else:
            action_bytes = action_data_raw  # Already bytes
        
        # Calculate new_next_run: use interval from job, or default to 60 seconds
        interval = job.get("interval", 60)
        new_next_run = int(time.time()) + interval

        # Execute ONCE only - no retries, no re-enqueue
        # Scheduler will handle the next execution at the scheduled time
        try:
            logger.info(f"⚙️  Executing workflow #{workflow_id} (single attempt)")
            
            # Execute workflow on-chain via ActionExecutor contract
            receipt = self.executor.execute_workflow(
                workflow_id=workflow_id,
                action_data=action_bytes,
                new_next_run=new_next_run,
                user=owner,
                gas_to_charge=gas_budget,
                wait_receipt=True
            )
            
            # Success - log transaction details
            tx_hash = receipt.transactionHash.hex() if hasattr(receipt, 'transactionHash') else receipt
            status = getattr(receipt, 'status', 'unknown')
            logger.info(f"✅ Workflow #{workflow_id} executed successfully: tx={tx_hash} status={status}")
            return
            
        except Exception as e:
            logger.error(f"❌ Execution failed for workflow #{workflow_id}: {e}")
            
            # Check if error is due to insufficient balance
            error_msg = str(e).lower()
            is_balance_error = "insufficient balance" in error_msg or "insufficient funds" in error_msg
            
            if is_balance_error:
                logger.error(f"💀 Balance error - workflow #{workflow_id} will wait for next scheduled run")
                logger.error(f"   Owner needs to deposit more funds to escrow.")
            else:
                logger.error(f"💀 Execution error - workflow #{workflow_id} will retry at next scheduled time")
            
            # DO NOT retry, DO NOT re-enqueue
            # Let the scheduler handle the next attempt at the scheduled next_run time
            return
