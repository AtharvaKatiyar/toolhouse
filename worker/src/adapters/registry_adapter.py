"""Registry adapter: interacts with WorkflowRegistry contract using web3.py"""
import json
import os
from web3 import Web3
from typing import Optional, Dict, Any, List
from ..utils.web3_provider import make_web3
from ..utils.config import settings
from ..utils.logger import logger

DEFAULT_ABI = [
    { "inputs":[{"internalType":"uint256","name":"workflowId","type":"uint256"}],"name":"getWorkflow","outputs":[{"components":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"uint8","name":"triggerType","type":"uint8"},{"internalType":"bytes","name":"triggerData","type":"bytes"},{"internalType":"uint8","name":"actionType","type":"uint8"},{"internalType":"bytes","name":"actionData","type":"bytes"},{"internalType":"uint256","name":"nextRun","type":"uint256"},{"internalType":"uint256","name":"interval","type":"uint256"},{"internalType":"bool","name":"active","type":"bool"},{"internalType":"uint256","name":"gasBudget","type":"uint256"}],"internalType":"struct WorkflowRegistry.Workflow","name":"","type":"tuple"}],"stateMutability":"view","type":"function"},
    {"inputs":[{"internalType":"address","name":"owner","type":"address"}],"name":"getWorkflowsByOwner","outputs":[{"internalType":"uint256[]","name":"","type":"uint256[]"}],"stateMutability":"view","type":"function"},
    {"inputs":[],"name":"totalWorkflows","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
    {"inputs":[{"internalType":"uint256","name":"workflowId","type":"uint256"}],"name":"getWorkflowMeta","outputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"bool","name":"active","type":"bool"},{"internalType":"uint256","name":"nextRun","type":"uint256"}],"stateMutability":"view","type":"function"}
]

class RegistryAdapter:
    def __init__(self, web3: Optional[Web3] = None, address: Optional[str] = None, abi_path: Optional[str] = None):
        self.w3 = web3 or make_web3()
        self.address = Web3.to_checksum_address(address or settings.REGISTRY_ADDRESS)
        
        # Default to loading ABI from file
        if abi_path is None:
            # Try default path first
            default_path = os.path.join(os.path.dirname(__file__), '../../abi/WorkflowRegistry.json')
            if os.path.exists(default_path):
                abi_path = default_path
        
        # Load ABI from file if present
        if abi_path and os.path.exists(abi_path):
            with open(abi_path, 'r') as f:
                artifact = json.load(f)
                # Extract ABI from Hardhat artifact format
                abi = artifact.get('abi', artifact)
        else:
            abi = DEFAULT_ABI
        
        self.contract = self.w3.eth.contract(address=self.address, abi=abi)
        logger.info(f"RegistryAdapter initialized for {self.address}")

    def total_workflows(self) -> int:
        return int(self.contract.functions.totalWorkflows().call())

    def get_workflow(self, workflow_id: int) -> Dict[str, Any]:
        raw = self.contract.functions.getWorkflow(workflow_id).call()
        return {
            'owner': raw[0],
            'triggerType': int(raw[1]),
            'triggerData': raw[2],
            'actionType': int(raw[3]),
            'actionData': raw[4],
            'nextRun': int(raw[5]),
            'interval': int(raw[6]),
            'active': bool(raw[7]),
            'gasBudget': int(raw[8])
        }

    def get_workflows_by_owner(self, owner: str) -> List[int]:
        return self.contract.functions.getWorkflowsByOwner(Web3.to_checksum_address(owner)).call()
