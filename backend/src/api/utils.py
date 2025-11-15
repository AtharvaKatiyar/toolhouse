"""
Utility API Routes
"""
from fastapi import APIRouter
from ..utils.web3_provider import w3
from ..utils.config import settings


router = APIRouter(prefix="/utils", tags=["Utils"])


@router.get("/healthz")
async def health_check():
    """
    Health check endpoint
    """
    try:
        # Check Web3 connection
        is_connected = w3.is_connected()
        
        return {
            "success": True,
            "status": "healthy" if is_connected else "degraded",
            "web3_connected": is_connected,
            "chain_id": settings.CHAIN_ID,
            "app": settings.APP_NAME
        }
    except Exception as e:
        return {
            "success": False,
            "status": "unhealthy",
            "error": str(e)
        }


@router.get("/trigger-types")
async def get_trigger_types():
    """
    Get trigger type definitions
    """
    return {
        "success": True,
        "trigger_types": {
            "1": {
                "name": "TIME",
                "description": "Execute at fixed intervals",
                "params": {
                    "interval_seconds": "uint256 - Interval in seconds"
                }
            },
            "2": {
                "name": "PRICE",
                "description": "Execute when price crosses threshold",
                "params": {
                    "symbol": "string - Asset symbol (e.g. 'ethereum')",
                    "threshold": "uint256 - Price threshold in USD (scaled by 1e18)",
                    "direction": "uint8 - 0=BELOW, 1=ABOVE"
                }
            },
            "3": {
                "name": "WALLET_EVENT",
                "description": "Execute on token balance changes",
                "params": {
                    "token_address": "address - ERC20 token address (0x0 for native)",
                    "event_type": "uint8 - 0=RECEIVED, 1=SENT, 2=BALANCE_CHANGE"
                }
            }
        }
    }


@router.get("/action-types")
async def get_action_types():
    """
    Get action type definitions
    """
    return {
        "success": True,
        "action_types": {
            "1": {
                "name": "NATIVE_TRANSFER",
                "description": "Transfer native currency (DEV on Moonbase)",
                "params": {
                    "recipient": "address - Recipient address",
                    "amount": "uint256 - Amount in wei"
                }
            },
            "2": {
                "name": "ERC20_TRANSFER",
                "description": "Transfer ERC20 tokens",
                "params": {
                    "token_address": "address - ERC20 token contract",
                    "recipient": "address - Recipient address",
                    "amount": "uint256 - Amount in token's smallest unit"
                }
            },
            "3": {
                "name": "CONTRACT_CALL",
                "description": "Execute arbitrary contract function",
                "params": {
                    "target": "address - Target contract address",
                    "value": "uint256 - Native currency to send (wei)",
                    "calldata": "bytes - ABI-encoded function call"
                }
            }
        }
    }


@router.get("/contracts")
async def get_contract_addresses():
    """
    Get deployed contract addresses
    """
    return {
        "success": True,
        "network": "Moonbase Alpha",
        "chain_id": settings.CHAIN_ID,
        "contracts": {
            "WorkflowRegistry": settings.WORKFLOW_REGISTRY_ADDRESS,
            "ActionExecutor": settings.ACTION_EXECUTOR_ADDRESS,
            "FeeEscrow": settings.FEE_ESCROW_ADDRESS
        },
        "rpc_url": settings.MOONBASE_RPC
    }
