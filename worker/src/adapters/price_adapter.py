"""Production-ready price adapter with caching. Uses httpx for async requests."""
import httpx
import asyncio
from time import time
from typing import Tuple
from ..utils.config import settings
from ..utils.logger import logger

class PriceAdapter:
    def __init__(self, url: str = None):
        self.url = url or settings.PRICE_FEED_URL
        self._cache = {}
        self._ttl = 15  # seconds

    async def _fetch_coingecko(self, token_id: str) -> float:
        params = {'ids': token_id, 'vs_currencies': 'usd'}
        async with httpx.AsyncClient(timeout=10.0) as client:
            r = await client.get(self.url, params=params)
            r.raise_for_status()
            data = r.json()
            if token_id in data and 'usd' in data[token_id]:
                return float(data[token_id]['usd'])
            raise RuntimeError('Price not found')

    async def get_price_usd(self, token_symbol: str) -> Tuple[float, str]:
        key = token_symbol.lower()
        now = time()
        entry = self._cache.get(key)
        if entry and now - entry['ts'] < self._ttl:
            return entry['price'], entry['source']
        # for MVP, map symbol->coingecko id naive mapping (improve in prod)
        mapping = {'dot': 'polkadot', 'glmr': 'moonbeam', 'astr': 'astar'}
        token_id = mapping.get(key, key)
        try:
            price = await self._fetch_coingecko(token_id)
            self._cache[key] = {'price': price, 'ts': now, 'source': 'coingecko'}
            return price, 'coingecko'
        except Exception as e:
            logger.error('Price fetch failed: %s', e)
            raise
