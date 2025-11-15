from typing import Dict, Any
from ..adapters.price_adapter import PriceAdapter
import asyncio

COMPARATORS = {
    0: lambda a,b: a < b,   # <
    1: lambda a,b: a <= b,  # <=
    2: lambda a,b: a > b,   # >
    3: lambda a,b: a >= b   # >=
}

class PriceTrigger:
    def __init__(self, adapter: PriceAdapter):
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
        price, src = await self.adapter.get_price_usd(token)
        cmp_fn = COMPARATORS.get(comparator)
        if cmp_fn is None:
            return False
        return cmp_fn(price, target)
