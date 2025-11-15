"""
Price API Routes
"""
from fastapi import APIRouter, HTTPException
from ..services.price_service import price_service
from ..utils.logger import logger


router = APIRouter(prefix="/price", tags=["Price"])


@router.get("/{symbol}")
async def get_price(symbol: str):
    """
    Get current price for a cryptocurrency
    """
    try:
        price = await price_service.get_price(symbol.lower())
        
        return {
            "success": True,
            "symbol": symbol.upper(),
            "price_usd": price
        }
        
    except Exception as e:
        logger.error(f"Failed to get price for {symbol}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/")
async def list_supported_assets():
    """
    Get list of supported price assets
    """
    try:
        assets = price_service.list_supported_assets()
        
        return {
            "success": True,
            "assets": assets
        }
        
    except Exception as e:
        logger.error(f"Failed to list assets: {e}")
        raise HTTPException(status_code=500, detail=str(e))
