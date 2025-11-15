"""
ABI Loader Service - Loads contract ABIs from JSON files
"""
import json
from pathlib import Path
from typing import List, Dict, Any
from ..utils.logger import logger


class ABILoader:
    """Load and cache contract ABIs"""
    
    def __init__(self):
        self.abi_dir = Path(__file__).parent.parent.parent / "abi"
        self._cache: Dict[str, List[Dict[str, Any]]] = {}
    
    def _load_abi(self, filename: str) -> List[Dict[str, Any]]:
        """Load ABI from file with caching"""
        if filename in self._cache:
            return self._cache[filename]
        
        filepath = self.abi_dir / filename
        if not filepath.exists():
            raise FileNotFoundError(f"ABI file not found: {filepath}")
        
        try:
            with open(filepath, 'r') as f:
                artifact = json.load(f)
            
            # Extract ABI from Hardhat artifact format
            abi = artifact.get("abi", [])
            self._cache[filename] = abi
            logger.info(f"Loaded ABI: {filename}")
            return abi
            
        except Exception as e:
            logger.error(f"Failed to load ABI {filename}: {e}")
            raise
    
    def load_registry(self) -> List[Dict[str, Any]]:
        """Load WorkflowRegistry ABI"""
        return self._load_abi("WorkflowRegistry.json")
    
    def load_executor(self) -> List[Dict[str, Any]]:
        """Load ActionExecutor ABI"""
        return self._load_abi("ActionExecutor.json")
    
    def load_escrow(self) -> List[Dict[str, Any]]:
        """Load FeeEscrow ABI"""
        return self._load_abi("FeeEscrow.json")


# Global ABI loader instance
abi_loader = ABILoader()
