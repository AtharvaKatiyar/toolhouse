"""
Encoder Service - Encodes workflow triggers and actions into bytes
"""
from web3 import Web3
from eth_abi import encode
from typing import Dict, Any
from ..utils.logger import logger


class EncoderService:
    """
    Encodes workflow triggers and actions into bytes format
    required by the smart contracts
    """
    
    def __init__(self):
        self.w3 = Web3()
    
    # ==================== TRIGGER ENCODERS ====================
    
    def encode_time_trigger(self, interval_seconds: int) -> bytes:
        """
        Encode TIME trigger
        
        Args:
            interval_seconds: Interval in seconds between executions
            
        Returns:
            bytes: ABI-encoded trigger data
        """
        # TIME trigger encodes interval as uint256
        encoded = encode(['uint256'], [interval_seconds])
        logger.info(f"Encoded TIME trigger: interval={interval_seconds}s")
        return encoded
    
    def encode_price_trigger(
        self, 
        symbol: str, 
        threshold: int,  # in wei for price (e.g., $2000 = 2000 * 10^18)
        direction: int   # 0 = above, 1 = below
    ) -> bytes:
        """
        Encode PRICE trigger
        
        Args:
            symbol: Asset symbol (e.g., "ETH", "BTC")
            threshold: Price threshold in wei
            direction: 0 for above threshold, 1 for below
            
        Returns:
            bytes: ABI-encoded trigger data
        """
        # PRICE trigger: symbol (bytes32), threshold (uint256), direction (uint8)
        symbol_bytes32 = self.w3.to_bytes(text=symbol).ljust(32, b'\x00')
        encoded = encode(
            ['bytes32', 'uint256', 'uint8'],
            [symbol_bytes32, threshold, direction]
        )
        logger.info(f"Encoded PRICE trigger: {symbol} {'above' if direction == 0 else 'below'} {threshold}")
        return encoded
    
    def encode_wallet_event_trigger(
        self,
        token_address: str,
        event_type: int  # 0 = transfer_in, 1 = transfer_out
    ) -> bytes:
        """
        Encode WALLET_EVENT trigger
        
        Args:
            token_address: ERC20 token address to watch (0x0 for native)
            event_type: 0 for transfers in, 1 for transfers out
            
        Returns:
            bytes: ABI-encoded trigger data
        """
        # WALLET_EVENT trigger: token (address), eventType (uint8)
        encoded = encode(
            ['address', 'uint8'],
            [self.w3.to_checksum_address(token_address), event_type]
        )
        logger.info(f"Encoded WALLET_EVENT trigger: token={token_address}, type={event_type}")
        return encoded
    
    # ==================== ACTION ENCODERS ====================
    
    def encode_native_transfer(self, recipient: str, amount: int) -> bytes:
        """
        Encode NATIVE_TRANSFER action (actionType = 1)
        
        Args:
            recipient: Recipient address
            amount: Amount in wei
            
        Returns:
            bytes: Action type (1 byte) + ABI-encoded parameters
        """
        # Action type 1 (NATIVE_TRANSFER)
        action_type = bytes([1])
        
        # ABI encode (address, uint256)
        params = encode(
            ['address', 'uint256'],
            [self.w3.to_checksum_address(recipient), amount]
        )
        
        # Concatenate: actionType + params
        action_data = action_type + params
        logger.info(f"Encoded NATIVE_TRANSFER: to={recipient}, amount={amount} wei")
        return action_data
    
    def encode_erc20_transfer(
        self, 
        token_address: str,
        recipient: str, 
        amount: int
    ) -> bytes:
        """
        Encode ERC20_TRANSFER action (actionType = 2)
        
        Args:
            token_address: ERC20 token contract address
            recipient: Recipient address
            amount: Amount in token's smallest unit
            
        Returns:
            bytes: Action type (1 byte) + ABI-encoded parameters
        """
        # Action type 2 (ERC20_TRANSFER)
        action_type = bytes([2])
        
        # ABI encode (address token, address to, uint256 amount)
        params = encode(
            ['address', 'address', 'uint256'],
            [
                self.w3.to_checksum_address(token_address),
                self.w3.to_checksum_address(recipient),
                amount
            ]
        )
        
        action_data = action_type + params
        logger.info(f"Encoded ERC20_TRANSFER: token={token_address}, to={recipient}, amount={amount}")
        return action_data
    
    def encode_contract_call(
        self,
        target_address: str,
        value: int,
        calldata: str
    ) -> bytes:
        """
        Encode CONTRACT_CALL action (actionType = 3)
        
        Args:
            target_address: Contract address to call
            value: Native token value to send (wei)
            calldata: Hex string of encoded function call
            
        Returns:
            bytes: Action type (1 byte) + ABI-encoded parameters
        """
        # Action type 3 (CONTRACT_CALL)
        action_type = bytes([3])
        
        # Convert calldata hex to bytes
        calldata_bytes = bytes.fromhex(calldata.replace('0x', ''))
        
        # ABI encode (address target, uint256 value, bytes callData)
        params = encode(
            ['address', 'uint256', 'bytes'],
            [
                self.w3.to_checksum_address(target_address),
                value,
                calldata_bytes
            ]
        )
        
        action_data = action_type + params
        logger.info(f"Encoded CONTRACT_CALL: target={target_address}, value={value}, calldata={calldata[:20]}...")
        return action_data
    
    # ==================== HELPER METHODS ====================
    
    def encode_trigger(self, trigger_type: int, trigger_params: Dict[str, Any]) -> bytes:
        """
        Encode trigger based on type
        
        Args:
            trigger_type: 1 (TIME), 2 (PRICE), 3 (WALLET_EVENT)
            trigger_params: Parameters specific to trigger type
            
        Returns:
            bytes: Encoded trigger data
        """
        if trigger_type == 1:  # TIME
            return self.encode_time_trigger(trigger_params['interval_seconds'])
        
        elif trigger_type == 2:  # PRICE
            return self.encode_price_trigger(
                trigger_params['symbol'],
                trigger_params['threshold'],
                trigger_params['direction']
            )
        
        elif trigger_type == 3:  # WALLET_EVENT
            return self.encode_wallet_event_trigger(
                trigger_params['token_address'],
                trigger_params['event_type']
            )
        
        else:
            raise ValueError(f"Invalid trigger type: {trigger_type}")
    
    def encode_action(self, action_type: int, action_params: Dict[str, Any]) -> bytes:
        """
        Encode action based on type
        
        Args:
            action_type: 1 (NATIVE), 2 (ERC20), 3 (CONTRACT_CALL)
            action_params: Parameters specific to action type
            
        Returns:
            bytes: Encoded action data with type prefix
        """
        if action_type == 1:  # NATIVE_TRANSFER
            return self.encode_native_transfer(
                action_params['recipient'],
                action_params['amount']
            )
        
        elif action_type == 2:  # ERC20_TRANSFER
            return self.encode_erc20_transfer(
                action_params['token_address'],
                action_params['recipient'],
                action_params['amount']
            )
        
        elif action_type == 3:  # CONTRACT_CALL
            return self.encode_contract_call(
                action_params['target_address'],
                action_params['value'],
                action_params['calldata']
            )
        
        else:
            raise ValueError(f"Invalid action type: {action_type}")


# Global encoder instance
encoder = EncoderService()
