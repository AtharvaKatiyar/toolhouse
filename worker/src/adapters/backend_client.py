"""
Backend API Client for Worker
Fetches cached data and metadata from the backend API
"""
import httpx
from typing import Dict, Any, List, Optional, Tuple
from ..utils.config import settings
from ..utils.logger import logger


class BackendClient:
    """
    Client to interact with the Autometa Backend API
    Provides cached workflow metadata and price data
    """
    
    def __init__(self, backend_url: str = None):
        """
        Initialize backend client
        
        Args:
            backend_url: Backend API base URL (e.g., http://localhost:8000)
        """
        self.backend_url = backend_url or getattr(settings, 'BACKEND_API_URL', 'http://localhost:8000')
        self.timeout = httpx.Timeout(10.0, connect=5.0)
        logger.info(f"BackendClient initialized with URL: {self.backend_url}")
    
    async def health_check(self) -> bool:
        """
        Check if backend is healthy and accessible
        
        Returns:
            True if backend is healthy, False otherwise
        """
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(f"{self.backend_url}/api/utils/healthz")
                response.raise_for_status()
                data = response.json()
                is_healthy = data.get('success', False) and data.get('status') == 'healthy'
                
                if is_healthy:
                    logger.info("✅ Backend is healthy")
                else:
                    logger.warning("⚠️ Backend returned unhealthy status")
                
                return is_healthy
                
        except Exception as e:
            logger.error(f"❌ Backend health check failed: {e}")
            return False
    
    async def get_price(self, symbol: str) -> Optional[Tuple[float, str]]:
        """
        Get cryptocurrency price from backend (with Redis caching)
        
        Args:
            symbol: Asset symbol (e.g., 'ethereum', 'bitcoin')
        
        Returns:
            Tuple of (price_usd, source) or None if failed
        """
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(f"{self.backend_url}/api/price/{symbol}")
                response.raise_for_status()
                data = response.json()
                
                if data.get('success'):
                    price = data.get('price_usd')
                    logger.info(f"📊 Got price from backend: {symbol} = ${price}")
                    return (price, 'backend-cache')
                else:
                    logger.warning(f"⚠️ Backend price query unsuccessful for {symbol}")
                    return None
                    
        except Exception as e:
            logger.error(f"❌ Failed to get price from backend for {symbol}: {e}")
            return None
    
    async def get_user_workflows(self, user_address: str) -> Optional[List[Dict[str, Any]]]:
        """
        Get all workflows for a user from backend
        
        Args:
            user_address: User's wallet address
        
        Returns:
            List of workflow dictionaries or None if failed
        """
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(
                    f"{self.backend_url}/api/workflow/user/{user_address}"
                )
                response.raise_for_status()
                data = response.json()
                
                if data.get('success'):
                    workflows = data.get('workflows', [])
                    logger.info(f"📋 Retrieved {len(workflows)} workflows for {user_address}")
                    return workflows
                else:
                    logger.warning(f"⚠️ Failed to get workflows for {user_address}")
                    return None
                    
        except Exception as e:
            logger.error(f"❌ Failed to get workflows from backend: {e}")
            return None
    
    async def get_workflow_metadata(self, workflow_id: int) -> Optional[Dict[str, Any]]:
        """
        Get metadata for a specific workflow (if backend caches it)
        
        Args:
            workflow_id: Workflow ID
        
        Returns:
            Workflow metadata dictionary or None
        """
        # Note: This endpoint doesn't exist yet, but could be added to backend
        # For now, we'll use the user workflows endpoint
        logger.debug(f"Workflow metadata endpoint not yet implemented for ID {workflow_id}")
        return None
    
    async def get_supported_assets(self) -> Optional[List[str]]:
        """
        Get list of supported price feed assets
        
        Returns:
            List of supported asset symbols or None if failed
        """
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(f"{self.backend_url}/api/price/")
                response.raise_for_status()
                data = response.json()
                
                if data.get('success'):
                    assets = data.get('assets', [])
                    logger.info(f"📊 Backend supports {len(assets)} assets")
                    return assets
                else:
                    return None
                    
        except Exception as e:
            logger.error(f"❌ Failed to get supported assets: {e}")
            return None
    
    async def get_contract_addresses(self) -> Optional[Dict[str, str]]:
        """
        Get deployed contract addresses from backend
        
        Returns:
            Dictionary of contract addresses or None if failed
        """
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(f"{self.backend_url}/api/utils/contracts")
                response.raise_for_status()
                data = response.json()
                
                if data.get('success'):
                    contracts = data.get('contracts', {})
                    logger.info(f"📜 Retrieved contract addresses from backend")
                    return contracts
                else:
                    return None
                    
        except Exception as e:
            logger.error(f"❌ Failed to get contract addresses: {e}")
            return None


# Global backend client instance
backend_client = BackendClient()
