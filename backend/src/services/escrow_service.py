"""
Escrow Service - Interact with FeeEscrow contract
"""
from typing import Dict, Any
from web3 import Web3
from ..utils.web3_provider import w3
from ..utils.config import settings
from ..utils.logger import logger
from .abi_loader import abi_loader


class EscrowService:
    """Service for interacting with FeeEscrow contract"""
    
    def __init__(self):
        self.escrow_address = settings.FEE_ESCROW_ADDRESS
        self.escrow_abi = abi_loader.load_escrow()
        self.contract = w3.eth.contract(
            address=Web3.to_checksum_address(self.escrow_address),
            abi=self.escrow_abi
        )
        logger.info(f"EscrowService initialized for {self.escrow_address}")
    
    def get_balance(self, user_address: str) -> int:
        """
        Get user's gas balance in FeeEscrow
        
        Args:
            user_address: User's address
            
        Returns:
            int: Balance in wei
        """
        try:
            checksum_address = Web3.to_checksum_address(user_address)
            balance = self.contract.functions.balances(checksum_address).call()
            logger.info(f"Balance for {user_address}: {w3.from_wei(balance, 'ether')} DEV")
            return balance
            
        except Exception as e:
            logger.error(f"Failed to get balance for {user_address}: {e}")
            raise
    
    def build_deposit_tx(self, user_address: str, amount: int) -> Dict[str, Any]:
        """
        Build deposit transaction for user to sign
        
        NOTE: User signs this transaction, not the relayer!
        Backend only constructs the transaction data.
        
        Args:
            user_address: User's address
            amount: Amount to deposit in wei
            
        Returns:
            Dict with transaction parameters for user to sign
        """
        try:
            checksum_address = Web3.to_checksum_address(user_address)
            
            # Get gas parameters
            latest_block = w3.eth.get_block('latest')
            base_fee = latest_block.get('baseFeePerGas', 0)
            max_priority_fee = w3.to_wei(2, 'gwei')
            max_fee = (base_fee * 2) + max_priority_fee
            
            # Build transaction data
            tx_data = self.contract.functions.depositGas().build_transaction({
                'from': checksum_address,
                'value': amount,
                'nonce': w3.eth.get_transaction_count(checksum_address),
                'maxFeePerGas': max_fee,
                'maxPriorityFeePerGas': max_priority_fee,
                'chainId': settings.CHAIN_ID
            })
            
            logger.info(f"Built deposit tx for {user_address}: {amount} wei")
            
            return {
                'to': self.escrow_address,
                'from': checksum_address,
                'value': hex(amount),
                'data': tx_data['data'],
                'nonce': hex(tx_data['nonce']),
                'maxFeePerGas': hex(max_fee),
                'maxPriorityFeePerGas': hex(max_priority_fee),
                'chainId': hex(settings.CHAIN_ID),
                'gas': hex(tx_data.get('gas', 100000))
            }
            
        except Exception as e:
            logger.error(f"Failed to build deposit tx: {e}")
            raise
    
    def build_withdraw_tx(self, user_address: str, amount: int) -> Dict[str, Any]:
        """
        Build withdraw transaction for user to sign
        
        NOTE: User signs this transaction, not the relayer!
        Backend only constructs the transaction data.
        
        Args:
            user_address: User's address
            amount: Amount to withdraw in wei
            
        Returns:
            Dict with transaction parameters for user to sign
        """
        try:
            checksum_address = Web3.to_checksum_address(user_address)
            
            # Get gas parameters
            latest_block = w3.eth.get_block('latest')
            base_fee = latest_block.get('baseFeePerGas', 0)
            max_priority_fee = w3.to_wei(2, 'gwei')
            max_fee = (base_fee * 2) + max_priority_fee
            
            # Build transaction data
            tx_data = self.contract.functions.withdrawGas(amount).build_transaction({
                'from': checksum_address,
                'nonce': w3.eth.get_transaction_count(checksum_address),
                'maxFeePerGas': max_fee,
                'maxPriorityFeePerGas': max_priority_fee,
                'chainId': settings.CHAIN_ID
            })
            
            logger.info(f"Built withdraw tx for {user_address}: {amount} wei")
            
            return {
                'to': self.escrow_address,
                'from': checksum_address,
                'value': '0x0',
                'data': tx_data['data'],
                'nonce': hex(tx_data['nonce']),
                'maxFeePerGas': hex(max_fee),
                'maxPriorityFeePerGas': hex(max_priority_fee),
                'chainId': hex(settings.CHAIN_ID),
                'gas': hex(tx_data.get('gas', 100000))
            }
            
        except Exception as e:
            logger.error(f"Failed to build withdraw tx: {e}")
            raise


# Global escrow service instance
escrow_service = EscrowService()
