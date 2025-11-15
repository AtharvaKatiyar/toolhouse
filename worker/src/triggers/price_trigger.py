from typing import Dict, Any
from ..adapters.enhanced_price_adapter import EnhancedPriceAdapter
from ..utils.config import settings
from ..utils.logger import logger
import asyncio

COMPARATORS = {
    0: lambda a,b: a < b,   # <
    1: lambda a,b: a <= b,  # <=
    2: lambda a,b: a > b,   # >
    3: lambda a,b: a >= b   # >=
}

class PriceTrigger:
    def __init__(self, adapter: EnhancedPriceAdapter = None):
        """
        Initialize price trigger with optional adapter
        
        Args:
            adapter: Price adapter (defaults to EnhancedPriceAdapter with backend integration)
        """
        if adapter is None:
            # Use enhanced adapter with backend integration by default
            adapter = EnhancedPriceAdapter(use_backend=settings.USE_BACKEND_INTEGRATION)
        
        self.adapter = adapter

    async def is_ready(self, workflow: Dict[str, Any]) -> bool:
        if not workflow.get('active', False):
            return False
        td = workflow.get('triggerData')
        # Expect JSON-like dict for MVP
        if isinstance(td, (bytes, bytearray)):
            import json
            td = json.loads(td.decode())
        if not isinstance(td, dict):
            return False
        token = td.get('token')
        comparator = int(td.get('comparator', 0))
        target = float(td.get('price_usd', 0.0))
        
        # Fetch price using enhanced adapter (backend-first strategy)
        price, source = await self.adapter.get_price_usd(token)
        
        # Log price check with source
        logger.debug(f"💰 Price check for {token}: ${price} (from {source}) vs target ${target}")
        
        cmp_fn = COMPARATORS.get(comparator)
        if cmp_fn is None:
            return False
        
        result = cmp_fn(price, target)
        
        if result:
            logger.info(f"✅ Trigger condition met: {token} ${price} ({source})")
        
        return result
