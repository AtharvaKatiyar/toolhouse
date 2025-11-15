"""
Registry Service - Interact with WorkflowRegistry contract
"""
from typing import List, Dict, Any, Optional
from web3 import Web3
from ..utils.web3_provider import w3
from ..utils.config import settings
from ..utils.logger import logger
from .abi_loader import abi_loader


class RegistryService:
    """Service for interacting with WorkflowRegistry contract"""
    
    def __init__(self):
        self.registry_address = settings.WORKFLOW_REGISTRY_ADDRESS
        self.registry_abi = abi_loader.load_registry()
        self.contract = w3.eth.contract(
            address=Web3.to_checksum_address(self.registry_address),
            abi=self.registry_abi
        )
        
        # Load relayer account
        if not settings.RELAYER_PRIVATE_KEY or settings.RELAYER_PRIVATE_KEY.startswith('0x0000'):
            raise ValueError("RELAYER_PRIVATE_KEY not configured in .env")
        
        self.relayer = w3.eth.account.from_key(settings.RELAYER_PRIVATE_KEY)
        logger.info(f"RegistryService initialized with relayer: {self.relayer.address}")
    
    def create_workflow(
        self,
        trigger_type: int,
        trigger_data: bytes,
        action_type: int,
        action_data: bytes,
        next_run: int,
        interval: int,
        gas_budget: int,
        user_address: str
    ) -> str:
        """
        Create a new workflow on-chain using relayer account
        
        Args:
            trigger_type: Type of trigger (1=TIME, 2=PRICE, 3=WALLET_EVENT)
            trigger_data: Encoded trigger parameters
            action_type: Type of action (1=NATIVE, 2=ERC20, 3=CONTRACT_CALL)
            action_data: Encoded action parameters
            next_run: Unix timestamp for next execution
            interval: Interval in seconds
            gas_budget: Gas budget in wei
            user_address: Owner of the workflow
            
        Returns:
            str: Transaction hash
        """
        try:
            # Get latest block for EIP-1559
            latest_block = w3.eth.get_block('latest')
            base_fee = latest_block.get('baseFeePerGas', 0)
            max_priority_fee = w3.to_wei(2, 'gwei')
            max_fee = (base_fee * 2) + max_priority_fee
            
            # Build transaction
            tx = self.contract.functions.createWorkflow(
                trigger_type,
                trigger_data,
                action_type,
                action_data,
                next_run,
                interval,
                gas_budget
            ).build_transaction({
                'from': self.relayer.address,
                'nonce': w3.eth.get_transaction_count(self.relayer.address),
                'maxFeePerGas': max_fee,
                'maxPriorityFeePerGas': max_priority_fee,
                'chainId': settings.CHAIN_ID
            })
            
            # Sign transaction
            signed_tx = self.relayer.sign_transaction(tx)
            
            # Send transaction
            tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction)
            tx_hex = tx_hash.hex()
            
            logger.info(f"Created workflow for {user_address}, tx: {tx_hex}")
            
            # Wait for receipt (optional, can be async)
            receipt = w3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)
            
            if receipt['status'] == 1:
                logger.info(f"✅ Workflow created successfully, tx: {tx_hex}")
            else:
                logger.error(f"❌ Workflow creation failed, tx: {tx_hex}")
            
            return tx_hex
            
        except Exception as e:
            logger.error(f"Failed to create workflow: {e}")
            raise
    
    def get_user_workflows(self, user_address: str) -> List[Dict[str, Any]]:
        """
        Get all workflows owned by a user
        
        Args:
            user_address: User's address
            
        Returns:
            List of workflow dictionaries
        """
        try:
            checksum_address = Web3.to_checksum_address(user_address)
            
            # Call getWorkflowsByOwner
            workflow_ids = self.contract.functions.getWorkflowsByOwner(
                checksum_address
            ).call()
            
            workflows = []
            for wf_id in workflow_ids:
                workflow = self._get_workflow_details(wf_id)
                if workflow:
                    workflows.append(workflow)
            
            logger.info(f"Retrieved {len(workflows)} workflows for {user_address}")
            return workflows
            
        except Exception as e:
            logger.error(f"Failed to get workflows for {user_address}: {e}")
            raise
    
    def _get_workflow_details(self, workflow_id: int) -> Optional[Dict[str, Any]]:
        """
        Get detailed information about a specific workflow
        
        Args:
            workflow_id: Workflow ID
            
        Returns:
            Workflow details dictionary
        """
        try:
            # Call getWorkflow
            wf = self.contract.functions.getWorkflow(workflow_id).call()
            
            # Parse workflow tuple
            # (owner, triggerType, triggerData, nextRun, actionData, 
            #  actionType, interval, active, gasBudget)
            workflow = {
                'id': workflow_id,
                'owner': wf[0],
                'trigger_type': wf[1],
                'trigger_data': wf[2].hex() if isinstance(wf[2], bytes) else wf[2],
                'next_run': wf[3],
                'action_data': wf[4].hex() if isinstance(wf[4], bytes) else wf[4],
                'action_type': wf[5],
                'interval': wf[6],
                'active': wf[7],
                'gas_budget': wf[8],
                'gas_budget_eth': w3.from_wei(wf[8], 'ether')
            }
            
            return workflow
            
        except Exception as e:
            logger.error(f"Failed to get workflow {workflow_id}: {e}")
            return None
    
    def delete_workflow(self, workflow_id: int) -> str:
        """
        Delete (deactivate) a workflow
        
        Args:
            workflow_id: Workflow ID to delete
            
        Returns:
            str: Transaction hash
        """
        try:
            # Get latest block for EIP-1559
            latest_block = w3.eth.get_block('latest')
            base_fee = latest_block.get('baseFeePerGas', 0)
            max_priority_fee = w3.to_wei(2, 'gwei')
            max_fee = (base_fee * 2) + max_priority_fee
            
            # Build transaction to set workflow inactive
            tx = self.contract.functions.adminSetWorkflow(
                workflow_id,
                False,  # Set active = false
                0       # nextRun = 0
            ).build_transaction({
                'from': self.relayer.address,
                'nonce': w3.eth.get_transaction_count(self.relayer.address),
                'maxFeePerGas': max_fee,
                'maxPriorityFeePerGas': max_priority_fee,
                'chainId': settings.CHAIN_ID
            })
            
            # Sign and send
            signed_tx = self.relayer.sign_transaction(tx)
            tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction)
            tx_hex = tx_hash.hex()
            
            logger.info(f"Deleted workflow #{workflow_id}, tx: {tx_hex}")
            return tx_hex
            
        except Exception as e:
            logger.error(f"Failed to delete workflow {workflow_id}: {e}")
            raise


# Global registry service instance
registry_service = RegistryService()
