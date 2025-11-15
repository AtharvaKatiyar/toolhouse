import redis
import json
from .config import settings
from .logger import logger

class JobQueue:
    """Redis-based job queue for workflow execution"""
    
    def __init__(self):
        """Initialize Redis connection for job queue"""
        self.redis_url = settings.REDIS_URL
        self.client = redis.from_url(self.redis_url, decode_responses=True)
        self.queue_name = "workflow_jobs"
        
        # Test connection
        try:
            self.client.ping()
            logger.info(f"JobQueue initialized with Redis: {self.redis_url}")
        except Exception as e:
            logger.error(f"Failed to connect to Redis: {e}")
            raise

    def push_job(self, job: dict) -> bool:
        """
        Push a job to the queue
        
        Args:
            job: Dictionary containing workflow execution details
                - workflowId: int
                - owner: str
                - triggerType: int
                - actionType: int
                - actionData: str (hex)
                - nextRun: int
                - gasBudget: int
                - retryCount: int (optional, default 0)
            
        Returns:
            True if successful, False otherwise
        """
        try:
            job_json = json.dumps(job)
            self.client.rpush(self.queue_name, job_json)
            logger.debug(f"Enqueued job for workflow #{job.get('workflowId')}")
            return True
        except Exception as e:
            logger.error(f"Failed to enqueue job: {e}")
            return False

    def pop_job(self, timeout: int = 5) -> dict | None:
        """
        Pop a job from the queue (blocking)
        
        Args:
            timeout: Maximum seconds to wait for a job
            
        Returns:
            Job dictionary or None if timeout
        """
        try:
            item = self.client.blpop(self.queue_name, timeout=timeout)
            if item:
                _, data = item
                job = json.loads(data)
                logger.debug(f"Dequeued job for workflow #{job.get('workflowId')}")
                return job
            return None
        except Exception as e:
            logger.error(f"Failed to dequeue job: {e}")
            return None

    def queue_length(self) -> int:
        """Get current queue length"""
        try:
            return self.client.llen(self.queue_name)
        except Exception as e:
            logger.error(f"Failed to get queue length: {e}")
            return 0

    def clear_queue(self):
        """Clear all jobs from queue (use with caution!)"""
        try:
            count = self.client.llen(self.queue_name)
            self.client.delete(self.queue_name)
            logger.warning(f"Queue cleared! Removed {count} jobs")
            return count
        except Exception as e:
            logger.error(f"Failed to clear queue: {e}")
            return 0

    def peek_job(self) -> dict | None:
        """
        Peek at the next job without removing it
        
        Returns:
            Job dictionary or None if queue is empty
        """
        try:
            data = self.client.lindex(self.queue_name, 0)
            if data:
                return json.loads(data)
            return None
        except Exception as e:
            logger.error(f"Failed to peek job: {e}")
            return None
