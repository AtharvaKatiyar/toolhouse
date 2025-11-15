import asyncio
import sys
from .scheduler.scheduler import Scheduler
from .executors.job_worker import JobWorker
from .utils.logger import logger

async def run_scheduler():
    """Run the scheduler that scans workflows and enqueues ready ones"""
    logger.info('🚀 Starting workflow scheduler...')
    sched = Scheduler()
    await sched.loop()

def run_worker():
    """Run the job worker that executes workflows from the queue"""
    logger.info('🚀 Starting job worker...')
    worker = JobWorker()
    worker.start()

async def main():
    # Determine mode from command line args
    mode = sys.argv[1] if len(sys.argv) > 1 else "scheduler"
    
    if mode == "scheduler":
        await run_scheduler()
    elif mode == "worker":
        run_worker()
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
