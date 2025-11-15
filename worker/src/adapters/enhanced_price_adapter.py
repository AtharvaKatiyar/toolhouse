"""
Enhanced Price Adapter with Backend Integration
Uses backend API as primary source (with Redis caching) and falls back to direct CoinGecko
"""
import httpx
import asyncio
from time import time
from typing import Tuple
from ..utils.config import settings
from ..utils.logger import logger
from .backend_client import backend_client


class EnhancedPriceAdapter:
    """
    Price adapter that uses backend API first (Redis cached) then falls back to direct fetch
    """
    
    def __init__(self, url: str = None, use_backend: bool = True):
        """
        Initialize enhanced price adapter
        
        Args:
            url: CoinGecko API URL (fallback)
            use_backend: Whether to use backend API as primary source
        """
        self.coingecko_url = url or settings.PRICE_FEED_URL
        self.use_backend = use_backend
        self._cache = {}
        self._ttl = 15  # seconds for local cache
        self._backend_available = None  # None = unknown, True/False = known state
        
        logger.info(f"EnhancedPriceAdapter initialized (backend: {use_backend})")

    async def _check_backend_availability(self) -> bool:
        """
        Check if backend is available (cached result)
        
        Returns:
            True if backend is available
        """
        if self._backend_available is None:
            self._backend_available = await backend_client.health_check()
        
        return self._backend_available

    async def _fetch_from_backend(self, token_symbol: str) -> Tuple[float, str]:
        """
        Fetch price from backend API (which has Redis caching)
        
        Args:
            token_symbol: Asset symbol
        
        Returns:
            Tuple of (price, source)
        
        Raises:
            RuntimeError if backend fetch fails
        """
        result = await backend_client.get_price(token_symbol)
        
        if result is None:
            raise RuntimeError(f"Backend price fetch failed for {token_symbol}")
        
        price, source = result
        return (price, f"backend-{source}")

    async def _fetch_coingecko_direct(self, token_id: str) -> float:
        """
        Fetch price directly from CoinGecko (fallback)
        
        Args:
            token_id: CoinGecko token ID
        
        Returns:
            Price in USD
        
        Raises:
            RuntimeError if fetch fails
        """
        params = {'ids': token_id, 'vs_currencies': 'usd'}
        async with httpx.AsyncClient(timeout=10.0) as client:
            r = await client.get(self.coingecko_url, params=params)
            r.raise_for_status()
            data = r.json()
            if token_id in data and 'usd' in data[token_id]:
                return float(data[token_id]['usd'])
            raise RuntimeError('Price not found in CoinGecko response')

    async def get_price_usd(self, token_symbol: str) -> Tuple[float, str]:
        """
        Get price in USD with backend-first strategy
        
        Strategy:
        1. Check local cache (15s TTL)
        2. Try backend API (has Redis cache with 30s TTL)
        3. Fall back to direct CoinGecko fetch
        
        Args:
            token_symbol: Asset symbol (e.g., 'ethereum', 'bitcoin', 'dot')
        
        Returns:
            Tuple of (price_usd, source)
        
        Raises:
            RuntimeError if all methods fail
        """
        key = token_symbol.lower()
        now = time()
        
        # Check local cache first
        entry = self._cache.get(key)
        if entry and now - entry['ts'] < self._ttl:
            logger.debug(f"💨 Price from local cache: {key} = ${entry['price']}")
            return (entry['price'], entry['source'] + '-cached')
        
        # Map common symbols to CoinGecko IDs
        symbol_mapping = {
            'dot': 'polkadot',
            'glmr': 'moonbeam',
            'astr': 'astar',
            'eth': 'ethereum',
            'btc': 'bitcoin',
            'matic': 'polygon'
        }
        token_id = symbol_mapping.get(key, key)
        
        price = None
        source = None
        
        # Strategy 1: Try backend API first (has Redis caching)
        if self.use_backend and await self._check_backend_availability():
            try:
                price, source = await self._fetch_from_backend(token_id)
                logger.info(f"✅ Price from backend: {key} = ${price}")
            except Exception as e:
                logger.warning(f"⚠️ Backend price fetch failed: {e}, trying fallback...")
                self._backend_available = False  # Mark as unavailable temporarily
        
        # Strategy 2: Fall back to direct CoinGecko
        if price is None:
            try:
                price = await self._fetch_coingecko_direct(token_id)
                source = 'coingecko-direct'
                logger.info(f"✅ Price from CoinGecko direct: {key} = ${price}")
            except Exception as e:
                logger.error(f"❌ Direct CoinGecko fetch failed: {e}")
                raise RuntimeError(f"All price sources failed for {token_symbol}")
        
        # Update local cache
        self._cache[key] = {'price': price, 'ts': now, 'source': source}
        
        return (price, source)

    async def get_multiple_prices(self, symbols: list) -> dict:
        """
        Get multiple prices efficiently
        
        Args:
            symbols: List of asset symbols
        
        Returns:
            Dictionary mapping symbol -> (price, source)
        """
        tasks = [self.get_price_usd(symbol) for symbol in symbols]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        prices = {}
        for symbol, result in zip(symbols, results):
            if isinstance(result, Exception):
                logger.error(f"Failed to get price for {symbol}: {result}")
            else:
                prices[symbol] = result
        
        return prices

    def set_backend_available(self, available: bool):
        """
        Manually set backend availability (useful for testing or failover)
        
        Args:
            available: True if backend is available
        """
        self._backend_available = available
        logger.info(f"Backend availability manually set to: {available}")


# For backward compatibility, create an alias to the original PriceAdapter
# This allows existing code to work without changes
PriceAdapter = EnhancedPriceAdapter
