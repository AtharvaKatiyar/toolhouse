"""
Workflow API Routes
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Dict, Any, List
from ..services.registry_service import registry_service
from ..services.encoder_service import encoder
from ..utils.logger import logger


router = APIRouter(prefix="/workflow", tags=["Workflow"])


# ==================== REQUEST MODELS ====================

class EncodeWorkflowRequest(BaseModel):
    """Request to encode workflow data"""
    trigger_type: int = Field(..., ge=1, le=3, description="1=TIME, 2=PRICE, 3=WALLET_EVENT")
    trigger_params: Dict[str, Any] = Field(..., description="Trigger-specific parameters")
    action_type: int = Field(..., ge=1, le=3, description="1=NATIVE, 2=ERC20, 3=CONTRACT_CALL")
    action_params: Dict[str, Any] = Field(..., description="Action-specific parameters")


class CreateWorkflowRequest(BaseModel):
    """Request to create a workflow on-chain"""
    trigger_type: int = Field(..., ge=1, le=3)
    trigger_params: Dict[str, Any]
    action_type: int = Field(..., ge=1, le=3)
    action_params: Dict[str, Any]
    next_run: int = Field(..., description="Unix timestamp for first execution")
    interval: int = Field(..., gt=0, description="Interval in seconds")
    gas_budget: int = Field(..., gt=0, description="Gas budget in wei")
    user_address: str = Field(..., description="Workflow owner address")


# ==================== ENDPOINTS ====================

@router.post("/encode")
async def encode_workflow(request: EncodeWorkflowRequest):
    """
    Encode workflow trigger and action into bytes
    (Does not create workflow on-chain)
    """
    try:
        # Encode trigger
        trigger_data = encoder.encode_trigger(
            request.trigger_type,
            request.trigger_params
        )
        
        # Encode action
        action_data = encoder.encode_action(
            request.action_type,
            request.action_params
        )
        
        return {
            "success": True,
            "trigger_data": "0x" + trigger_data.hex(),
            "action_data": "0x" + action_data.hex(),
            "trigger_type": request.trigger_type,
            "action_type": request.action_type
        }
        
    except Exception as e:
        logger.error(f"Encoding failed: {e}")
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/create")
async def create_workflow(request: CreateWorkflowRequest):
    """
    Create a new workflow on-chain using relayer
    """
    try:
        # Encode trigger and action
        trigger_data = encoder.encode_trigger(
            request.trigger_type,
            request.trigger_params
        )
        
        action_data = encoder.encode_action(
            request.action_type,
            request.action_params
        )
        
        # Create workflow on-chain
        tx_hash = registry_service.create_workflow(
            trigger_type=request.trigger_type,
            trigger_data=trigger_data,
            action_type=request.action_type,
            action_data=action_data,
            next_run=request.next_run,
            interval=request.interval,
            gas_budget=request.gas_budget,
            user_address=request.user_address
        )
        
        return {
            "success": True,
            "tx_hash": tx_hash,
            "message": "Workflow created successfully"
        }
        
    except Exception as e:
        logger.error(f"Workflow creation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/user/{address}")
async def get_user_workflows(address: str):
    """
    Get all workflows owned by a user
    """
    try:
        workflows = registry_service.get_user_workflows(address)
        
        return {
            "success": True,
            "count": len(workflows),
            "workflows": workflows
        }
        
    except Exception as e:
        logger.error(f"Failed to get workflows: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{workflow_id}")
async def delete_workflow(workflow_id: int):
    """
    Delete (deactivate) a workflow
    """
    try:
        tx_hash = registry_service.delete_workflow(workflow_id)
        
        return {
            "success": True,
            "tx_hash": tx_hash,
            "message": f"Workflow #{workflow_id} deleted successfully"
        }
        
    except Exception as e:
        logger.error(f"Workflow deletion failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
