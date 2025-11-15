import asyncio
from typing import List
from ..adapters.registry_adapter import RegistryAdapter
from ..utils.web3_provider import make_web3
from ..utils.config import settings
from ..triggers.time_trigger import TimeTrigger
from ..triggers.price_trigger import PriceTrigger
from ..triggers.wallet_event_trigger import WalletEventTrigger
from ..adapters.price_adapter import PriceAdapter
from ..utils.logger import logger
from ..utils.queue import JobQueue

class Scheduler:
    def __init__(self):
        self.w3 = make_web3()
        self.registry = RegistryAdapter(self.w3)
        self.price_adapter = PriceAdapter()
        self.time_trigger = TimeTrigger()
        self.price_trigger = PriceTrigger(self.price_adapter)
        self.event_trigger = WalletEventTrigger(self.w3)
        self.poll_interval = settings.POLL_INTERVAL
        self._running = False
        
        # Initialize job queue for queue-based execution
        try:
            self.queue = JobQueue()
            logger.info("📥 Scheduler initialized with job queue")
        except Exception as e:
            logger.error(f"Failed to initialize job queue: {e}")
            raise

    async def _evaluate_workflow(self, workflow_id: int):
        try:
            wf = self.registry.get_workflow(workflow_id)
        except Exception as e:
            logger.error('Failed to fetch workflow %s: %s', workflow_id, e)
            return None

        # Evaluate triggers
        if wf['triggerType'] == 1:
            if self.time_trigger.is_ready(wf):
                return wf
        elif wf['triggerType'] == 2:
            try:
                ready = await self.price_trigger.is_ready(wf)
                if ready:
                    return wf
            except Exception as e:
                logger.error('Price trigger error for %s: %s', workflow_id, e)
        elif wf['triggerType'] == 3:
            try:
                if self.event_trigger.is_ready(wf):
                    return wf
            except Exception as e:
                logger.error('Event trigger error for %s: %s', workflow_id, e)
        return None

    def _enqueue_workflow(self, wf: dict, workflow_id: int):
        """Convert workflow to job and push to Redis queue"""
        try:
            # Convert actionData bytes to hex string for JSON serialization
            action_data = wf.get("actionData", b"")
            if isinstance(action_data, (bytes, bytearray)):
                action_data = action_data.hex()
            
            # Create job payload
            job = {
                "workflowId": workflow_id,
                "owner": wf["owner"],
                "triggerType": wf["triggerType"],
                "actionType": wf["actionType"],
                "actionData": action_data,
                "nextRun": wf["nextRun"],
                "gasBudget": wf["gasBudget"],
                "retryCount": 0
            }
            
            # Push to queue
            success = self.queue.push_job(job)
            if success:
                logger.info(f"📥 Enqueued workflow #{workflow_id} (owner: {wf['owner'][:10]}...)")
            else:
                logger.error(f"❌ Failed to enqueue workflow #{workflow_id}")
                
        except Exception as e:
            logger.error(f"Error enqueuing workflow #{workflow_id}: {e}")

    async def run_once(self):
        total = self.registry.total_workflows()
        logger.debug(f"Scanning {total} workflows...")
        
        # Evaluate all workflows concurrently
        tasks = []
        for wid in range(1, total+1):
            tasks.append(self._evaluate_workflow(wid))
        results = await asyncio.gather(*tasks)
        
        # Filter ready workflows and enqueue them
        ready_count = 0
        for wid, wf in enumerate(results, start=1):
            if wf:
                self._enqueue_workflow(wf, wid)
                ready_count += 1
        
        if ready_count > 0:
            queue_len = self.queue.queue_length()
            logger.info(f"✓ Enqueued {ready_count} workflow(s). Queue length: {queue_len}")
        
        return [r for r in results if r]

    async def loop(self):
        self._running = True
        logger.info(f"📅 Scheduler loop started (polling every {self.poll_interval}s)")
        
        while self._running:
            try:
                await self.run_once()
            except Exception as e:
                logger.error('Scheduler loop error: %s', e)
            await asyncio.sleep(self.poll_interval)

    def stop(self):
        self._running = False
        logger.info("Scheduler stopped")
