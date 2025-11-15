import time
from typing import Dict, Any

class TimeTrigger:
    def is_ready(self, workflow: Dict[str, Any]) -> bool:
        if not workflow.get('active', False):
            return False
        next_run = int(workflow.get('nextRun') or 0)
        now = int(time.time())
        return now >= next_run
