"""
Escrow API Routes
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from ..services.escrow_service import escrow_service
from ..utils.logger import logger


router = APIRouter(prefix="/escrow", tags=["Escrow"])


# ==================== REQUEST MODELS ====================

class DepositRequest(BaseModel):
    """Request to build a deposit transaction"""
    user_address: str = Field(..., description="User's wallet address")
    amount: int = Field(..., gt=0, description="Amount to deposit in wei")


class WithdrawRequest(BaseModel):
    """Request to build a withdraw transaction"""
    user_address: str = Field(..., description="User's wallet address")
    amount: int = Field(..., gt=0, description="Amount to withdraw in wei")


# ==================== ENDPOINTS ====================

@router.get("/balance/{address}")
async def get_balance(address: str):
    """
    Get user's gas balance in escrow
    """
    try:
        balance = escrow_service.get_balance(address)
        
        return {
            "success": True,
            "address": address,
            "balance": balance,
            "balance_eth": balance / 1e18
        }
        
    except Exception as e:
        logger.error(f"Failed to get balance: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/deposit")
async def build_deposit_tx(request: DepositRequest):
    """
    Build a deposit transaction for user to sign
    """
    try:
        tx_data = escrow_service.build_deposit_tx(
            request.user_address,
            request.amount
        )
        
        return {
            "success": True,
            "tx": tx_data,
            "message": "Sign this transaction to deposit gas"
        }
        
    except Exception as e:
        logger.error(f"Failed to build deposit tx: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/withdraw")
async def build_withdraw_tx(request: WithdrawRequest):
    """
    Build a withdraw transaction for user to sign
    """
    try:
        tx_data = escrow_service.build_withdraw_tx(
            request.user_address,
            request.amount
        )
        
        return {
            "success": True,
            "tx": tx_data,
            "message": "Sign this transaction to withdraw gas"
        }
        
    except Exception as e:
        logger.error(f"Failed to build withdraw tx: {e}")
        raise HTTPException(status_code=500, detail=str(e))
