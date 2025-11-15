"""
Backend Configuration using Pydantic Settings
"""
from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""
    
    # Application
    APP_NAME: str = "Autometa Backend API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    
    # Moonbase Alpha Configuration
    MOONBASE_RPC: str = "https://rpc.api.moonbase.moonbeam.network"
    CHAIN_ID: int = 1287
    
    # Contract Addresses (from Phase 2 deployment)
    WORKFLOW_REGISTRY_ADDRESS: str = "0x87bb7A86E657f1dDd2e84946545b6686935E3a56"
    ACTION_EXECUTOR_ADDRESS: str = "0x1Cb45BceCC3f0CEd2875b49d4f6dd5543B2bD559"
    FEE_ESCROW_ADDRESS: str = "0x6a4E6dA8A8B9C1a178d7B1E4EE1279653A806C7e"
    
    # Relayer Configuration (CRITICAL - backend signs transactions)
    RELAYER_PRIVATE_KEY: str = ""
    
    # Redis Configuration
    REDIS_URL: str = "redis://localhost:6379/0"
    REDIS_CACHE_TTL: int = 30  # seconds
    
    # Price Feed
    PRICE_FEED_URL: str = "https://api.coingecko.com/api/v3/simple/price"
    SUPPORTED_ASSETS: List[str] = [
        "ethereum", "bitcoin", "moonbeam", "polkadot", 
        "uniswap", "chainlink", "aave"
    ]
    
    # CORS Configuration
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:3001", 
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001"
    ]
    
    # API Configuration
    API_PREFIX: str = "/api"
    DOCS_URL: str = "/docs"
    OPENAPI_URL: str = "/openapi.json"
    
    class Config:
        env_file = ".env"
        case_sensitive = True


# Global settings instance
settings = Settings()
