from web3 import Web3
from web3.middleware import geth_poa_middleware
from typing import Optional
from .config import settings

def make_web3(rpc: Optional[str] = None) -> Web3:
    url = rpc or settings.MOONBASE_RPC
    w3 = Web3(Web3.HTTPProvider(url, request_kwargs={'timeout': 30}))
    # Inject PoA middleware if necessary
    try:
        w3.middleware_onion.inject(geth_poa_middleware, layer=0)
    except Exception:
        pass
    return w3
