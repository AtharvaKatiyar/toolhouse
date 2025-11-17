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
        result = registry_service.create_workflow(
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
            "tx_hash": result["tx_hash"],
            "workflow_id": result["workflow_id"],
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


@router.get("/{workflow_id}")
async def get_workflow(workflow_id: int):
    """
    Get a single workflow by ID
    """
    try:
        workflow = registry_service.get_workflow(workflow_id)
        
        if not workflow:
            raise HTTPException(status_code=404, detail=f"Workflow #{workflow_id} not found")
        
        return {
            "success": True,
            "workflow": workflow
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get workflow: {e}")
        raise HTTPException(status_code=500, detail=str(e))


class UpdateWorkflowStatusRequest(BaseModel):
    """Request to update workflow status"""
    status: str = Field(..., description="New status: 'active' or 'paused'")


@router.patch("/{workflow_id}/status")
async def update_workflow_status(workflow_id: int, request: UpdateWorkflowStatusRequest):
    """
    Update workflow status (pause/resume)
    """
    try:
        if request.status not in ['active', 'paused']:
            raise HTTPException(status_code=400, detail="Status must be 'active' or 'paused'")
        
        is_active = request.status == 'active'
        tx_hash = registry_service.update_workflow_status(workflow_id, is_active)
        
        return {
            "success": True,
            "tx_hash": tx_hash,
            "message": f"Workflow #{workflow_id} {'activated' if is_active else 'paused'}"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update workflow status: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/executions/{workflow_id}")
async def get_workflow_executions(workflow_id: int):
    """
    Get execution history for a specific workflow
    
    Note: This is a placeholder endpoint. In production, this would query
    execution logs from a database or event logs from the blockchain.
    """
    try:
        # For now, return empty array since we don't have execution tracking yet
        # TODO: Implement execution tracking by listening to blockchain events
        return {
            "success": True,
            "workflow_id": workflow_id,
            "executions": []
        }
        
    except Exception as e:
        logger.error(f"Failed to get executions: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/metadata/{workflow_id}")
async def get_workflow_metadata(workflow_id: int):
    """
    Get workflow metadata from blockchain events (creation time, execution count)
    """
    try:
        from web3 import Web3
        from eth_utils import event_signature_to_log_topic
        import os
        
        # Connect to blockchain
        rpc_url = os.getenv("RPC_URL", "https://rpc.api.moonbase.moonbeam.network")
        w3 = Web3(Web3.HTTPProvider(rpc_url))
        
        registry_address = os.getenv("WORKFLOW_REGISTRY")
        
        # Get WorkflowCreated event for creation time
        created_topic = '0x' + event_signature_to_log_topic('WorkflowCreated(uint256,address)').hex()
        workflow_id_topic = '0x' + hex(workflow_id)[2:].zfill(64)
        
        # Fetch WorkflowCreated event (search last 100,000 blocks)
        latest_block = w3.eth.block_number
        from_block = max(0, latest_block - 100000)
        
        created_logs = w3.eth.get_logs({
            'address': registry_address,
            'topics': [created_topic, workflow_id_topic],
            'fromBlock': from_block,
            'toBlock': 'latest'
        })
        
        created_at = None
        created_block = None
        if created_logs:
            created_block = created_logs[0]['blockNumber']
            block_data = w3.eth.get_block(created_block)
            created_at = int(block_data['timestamp'])
        
        # Get ActionExecutor ExecuteWorkflow events for execution count
        executor_address = os.getenv("ACTION_EXECUTOR")
        execute_topic = '0x' + event_signature_to_log_topic('WorkflowExecuted(uint256,address,bool)').hex()
        
        execution_logs = w3.eth.get_logs({
            'address': executor_address,
            'topics': [execute_topic, workflow_id_topic],
            'fromBlock': from_block,
            'toBlock': 'latest'
        })
        
        execution_count = len(execution_logs)
        
        # Get last execution time if any
        last_executed = None
        if execution_logs:
            last_log = execution_logs[-1]
            last_block = w3.eth.get_block(last_log['blockNumber'])
            last_executed = int(last_block['timestamp'])
        
        return {
            "success": True,
            "workflow_id": workflow_id,
            "created_at": created_at,
            "created_block": created_block,
            "execution_count": execution_count,
            "last_executed": last_executed
        }
        
    except Exception as e:
        logger.error(f"Failed to get workflow metadata: {e}")
        # Return default values on error
        return {
            "success": False,
            "workflow_id": workflow_id,
            "created_at": None,
            "created_block": None,
            "execution_count": 0,
            "last_executed": None,
            "error": str(e)
        }


@router.get("/executions/all")
async def get_all_executions(user: str = None):
    """
    Get all workflow executions, optionally filtered by user
    
    Note: This is a placeholder endpoint. In production, this would query
    execution logs from a database or event logs from the blockchain.
    """
    try:
        # For now, return empty array since we don't have execution tracking yet
        # TODO: Implement execution tracking by listening to blockchain events
        return {
            "success": True,
            "user": user,
            "executions": []
        }
        
    except Exception as e:
        logger.error(f"Failed to get executions: {e}")
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
