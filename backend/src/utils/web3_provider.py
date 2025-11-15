"""
Web3 Provider for connecting to Moonbase Alpha
"""
from web3 import Web3
from web3.middleware import geth_poa_middleware
from .config import settings
from .logger import logger


def make_web3() -> Web3:
    """
    Create and configure Web3 instance for Moonbase Alpha
    
    Returns:
        Web3: Configured Web3 instance
        
    Raises:
        ConnectionError: If unable to connect to RPC
    """
    try:
        # Create Web3 instance
        w3 = Web3(Web3.HTTPProvider(settings.MOONBASE_RPC))
        
        # Inject POA middleware for Moonbeam compatibility
        w3.middleware_onion.inject(geth_poa_middleware, layer=0)
        
        # Verify connection
        if not w3.is_connected():
            raise ConnectionError(f"Failed to connect to {settings.MOONBASE_RPC}")
        
        # Verify chain ID
        chain_id = w3.eth.chain_id
        if chain_id != settings.CHAIN_ID:
            logger.warning(
                f"Chain ID mismatch. Expected {settings.CHAIN_ID}, got {chain_id}"
            )
        
        logger.info(f"✅ Connected to Moonbase Alpha (Chain ID: {chain_id})")
        return w3
        
    except Exception as e:
        logger.error(f"Failed to initialize Web3: {e}")
        raise


# Global Web3 instance
w3 = make_web3()
