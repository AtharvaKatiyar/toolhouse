from typing import Dict, Any
from web3 import Web3
from ..utils.logger import logger

class WalletEventTrigger:
    def __init__(self, web3: Web3):
        self.w3 = web3

    def is_ready(self, workflow: Dict[str, Any], from_block: int = None, to_block: int = None) -> bool:
        td = workflow.get('triggerData')
        if isinstance(td, (bytes, bytearray)):
            import json
            td = json.loads(td.decode())
        monitor = td.get('monitor')
        token = td.get('token')  # optional token address for ERC20
        min_amount = int(td.get('min_amount', 0))
        if not monitor:
            return False
        if token:
            try:
                token_addr = Web3.to_checksum_address(token)
                erc20 = self.w3.eth.contract(address=token_addr, abi=[{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Transfer","type":"event"}])
                # scanning last 100 blocks by default
                to_block = to_block or self.w3.eth.block_number
                from_block = from_block or max(0, to_block - 100)
                events = erc20.events.Transfer().get_logs(fromBlock=from_block, toBlock=to_block, argument_filters={'to': monitor})
                for e in events:
                    if int(e['args']['value']) >= min_amount:
                        return True
                return False
            except Exception as e:
                logger.error('ERC20 event scan failed: %s', e)
                return False
        else:
            # native transfers detection requires scanning tx receipts; not implemented here
            return False
