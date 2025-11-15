"""
Price Service - Fetch and cache cryptocurrency prices
"""
import httpx
import redis
import json
from typing import Dict, List, Optional
from ..utils.config import settings
from ..utils.logger import logger


class PriceService:
    """Service for fetching cryptocurrency prices with Redis caching"""
    
    def __init__(self):
        self.price_api_url = settings.PRICE_FEED_URL
        self.supported_assets = settings.SUPPORTED_ASSETS
        self.cache_ttl = settings.REDIS_CACHE_TTL
        
        # Initialize Redis client
        try:
            self.redis_client = redis.from_url(settings.REDIS_URL)
            self.redis_client.ping()
            logger.info("PriceService connected to Redis")
        except Exception as e:
            logger.warning(f"Redis connection failed, caching disabled: {e}")
            self.redis_client = None
    
    async def get_price(self, symbol: str) -> Optional[float]:
        """
        Get price for a specific asset with caching
        
        Args:
            symbol: Asset symbol (e.g., "ethereum", "bitcoin")
            
        Returns:
            float: Price in USD, or None if not found
        """
        symbol = symbol.lower()
        
        # Check cache first
        cache_key = f"price:{symbol}"
        if self.redis_client:
            try:
                cached = self.redis_client.get(cache_key)
                if cached:
                    price = float(cached)
                    logger.info(f"Cache hit for {symbol}: ${price}")
                    return price
            except Exception as e:
                logger.warning(f"Redis cache read failed: {e}")
        
        # Fetch from API
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    self.price_api_url,
                    params={
                        'ids': symbol,
                        'vs_currencies': 'usd'
                    },
                    timeout=10.0
                )
                response.raise_for_status()
                data = response.json()
                
                if symbol in data and 'usd' in data[symbol]:
                    price = data[symbol]['usd']
                    
                    # Cache the result
                    if self.redis_client:
                        try:
                            self.redis_client.setex(
                                cache_key,
                                self.cache_ttl,
                                str(price)
                            )
                        except Exception as e:
                            logger.warning(f"Redis cache write failed: {e}")
                    
                    logger.info(f"Fetched price for {symbol}: ${price}")
                    return price
                else:
                    logger.warning(f"Price not found for {symbol}")
                    return None
                    
        except Exception as e:
            logger.error(f"Failed to fetch price for {symbol}: {e}")
            return None
    
    async def get_multiple_prices(self, symbols: List[str]) -> Dict[str, float]:
        """
        Get prices for multiple assets at once
        
        Args:
            symbols: List of asset symbols
            
        Returns:
            Dict mapping symbol to price
        """
        symbols_str = ','.join([s.lower() for s in symbols])
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    self.price_api_url,
                    params={
                        'ids': symbols_str,
                        'vs_currencies': 'usd'
                    },
                    timeout=10.0
                )
                response.raise_for_status()
                data = response.json()
                
                prices = {}
                for symbol in symbols:
                    symbol_lower = symbol.lower()
                    if symbol_lower in data and 'usd' in data[symbol_lower]:
                        price = data[symbol_lower]['usd']
                        prices[symbol] = price
                        
                        # Cache each price
                        if self.redis_client:
                            try:
                                cache_key = f"price:{symbol_lower}"
                                self.redis_client.setex(
                                    cache_key,
                                    self.cache_ttl,
                                    str(price)
                                )
                            except Exception as e:
                                logger.warning(f"Redis cache write failed: {e}")
                
                logger.info(f"Fetched {len(prices)} prices")
                return prices
                
        except Exception as e:
            logger.error(f"Failed to fetch multiple prices: {e}")
            return {}
    
    def list_supported_assets(self) -> List[str]:
        """
        Get list of supported assets
        
        Returns:
            List of supported asset symbols
        """
        return self.supported_assets


# Global price service instance
price_service = PriceService()
