from pydantic import Field
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # RPC and contracts
    MOONBASE_RPC: str = Field(default='https://rpc.api.moonbase.moonbeam.network')
    REGISTRY_ADDRESS: str = Field(default='')
    ACTIONEXECUTOR_ADDRESS: str = Field(default='')
    FEEESCROW_ADDRESS: str = Field(default='')

    # Worker keys & behaviour
    WORKER_PRIVATE_KEY: str = Field(default='')
    POLL_INTERVAL: int = Field(default=10)
    MAX_CONCURRENT_EXECUTIONS: int = Field(default=3)

    # Price feed
    PRICE_FEED_URL: str = Field(default='https://api.coingecko.com/api/v3/simple/price')

    # Backend API integration (for cached prices and metadata)
    BACKEND_API_URL: str = Field(default='http://localhost:8000')
    USE_BACKEND_INTEGRATION: bool = Field(default=True)

    # Redis for queue-based execution
    REDIS_URL: str = Field(default='redis://localhost:6379/0')

    class Config:
        env_file = '.env'
        env_file_encoding = 'utf-8'

settings = Settings()
