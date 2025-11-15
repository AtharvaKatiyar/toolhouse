from abc import ABC, abstractmethod

class BaseExecutor(ABC):
    @abstractmethod
    def execute(self, workflow, context):
        pass
