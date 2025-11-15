from web3 import Web3
from ..utils.logger import logger

class ContractExecutor:
    def __init__(self, web3: Web3):
        self.w3 = web3

    def call_contract(self, target, value, calldata, private_key):
        acct = self.w3.eth.account.from_key(private_key)
        tx = {
            'to': target,
            'value': value,
            'data': calldata,
            'nonce': self.w3.eth.get_transaction_count(acct.address),
            'gasPrice': self.w3.eth.gas_price,
            'chainId': self.w3.eth.chain_id
        }
        signed = acct.sign_transaction(tx)
        tx_hash = self.w3.eth.send_raw_transaction(signed.rawTransaction)
        logger.info('Contract call tx: %s', tx_hash.hex())
        return tx_hash
