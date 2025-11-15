import asyncio
import sys
from .scheduler.scheduler import Scheduler
from .executors.job_worker import JobWorker
from .utils.logger import logger
from .utils.config import settings
from .adapters.backend_client import backend_client

async def check_backend_health():
    """
    Check if backend API is available and log status
    """
    if not settings.USE_BACKEND_INTEGRATION:
        logger.info("🔌 Backend integration disabled in config")
        return
    
    logger.info(f"🔍 Checking backend health at {settings.BACKEND_API_URL}...")
    
    is_healthy = await backend_client.health_check()
    
    if is_healthy:
        logger.info(f"✅ Backend is healthy at {settings.BACKEND_API_URL}")
        
        # Optionally fetch contract addresses for verification
        contracts = await backend_client.get_contract_addresses()
        if contracts:
            logger.info(f"📋 Backend contract addresses:")
            for name, address in contracts.items():
                logger.info(f"   {name}: {address}")
    else:
        logger.warning(f"⚠️ Backend at {settings.BACKEND_API_URL} is not available")
        logger.warning(f"   Worker will fall back to direct CoinGecko API calls")

async def run_scheduler():
    """Run the scheduler that scans workflows and enqueues ready ones"""
    logger.info('🚀 Starting workflow scheduler...')
    
    # Check backend health on startup
    await check_backend_health()
    
    sched = Scheduler()
    await sched.loop()

async def run_worker():
    """Run the job worker that executes workflows from the queue"""
    logger.info('🚀 Starting job worker...')
    
    # Check backend health on startup
    await check_backend_health()
    
    worker = JobWorker()
    worker.start()

async def main():
    # Determine mode from command line args
    mode = sys.argv[1] if len(sys.argv) > 1 else "scheduler"
    
    if mode == "scheduler":
        await run_scheduler()
    elif mode == "worker":
        await run_worker()
    else:
        logger.error(f"Unknown mode: {mode}. Use 'scheduler' or 'worker'")
        logger.info("Usage: python -m src.main [scheduler|worker]")
        logger.info("  scheduler - Scan workflows and enqueue ready ones")
        logger.info("  worker    - Execute workflows from the queue")
        sys.exit(1)

if __name__ == '__main__':
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info('✋ Shutting down gracefully')
