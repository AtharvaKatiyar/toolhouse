# Autometa Backend API

FastAPI-based backend for Phase 4 of the Autometa project. Provides HTTP endpoints for workflow management, escrow operations, and price feeds.

## Architecture

```
backend/
├── src/
│   ├── api/              # FastAPI route handlers
│   │   ├── workflow.py   # Workflow CRUD operations
│   │   ├── escrow.py     # Gas escrow operations
│   │   ├── price.py      # Price feed endpoints
│   │   └── utils.py      # Health & metadata endpoints
│   ├── services/         # Business logic
│   │   ├── encoder_service.py      # Encode triggers & actions
│   │   ├── registry_service.py     # WorkflowRegistry interaction
│   │   ├── escrow_service.py       # FeeEscrow interaction
│   │   ├── price_service.py        # CoinGecko price feeds
│   │   └── abi_loader.py           # Load contract ABIs
│   └── utils/            # Utilities
│       ├── config.py     # Pydantic settings
│       ├── web3_provider.py  # Web3 connection
│       └── logger.py     # JSON logging
├── abi/                  # Contract ABI files
├── .env                  # Environment variables
└── requirements.txt      # Python dependencies
```

## Setup

### 1. Install Dependencies

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 2. Configure Environment

Edit `.env` and set your relayer private key:

```bash
# IMPORTANT: Replace this placeholder!
RELAYER_PRIVATE_KEY=your_actual_private_key_here
```

**⚠️ Security**: Never commit your real private key! Use a dedicated relayer account with limited funds.

### 3. Start Redis (Required for Price Caching)

```bash
# Using Docker
docker run -d -p 6379:6379 redis:7-alpine

# Or install locally
sudo apt install redis-server
redis-server
```

### 4. Start the Backend

```bash
./start.sh
```

The API will be available at:
- **API**: http://localhost:8000
- **Docs**: http://localhost:8000/docs (Swagger UI)
- **OpenAPI**: http://localhost:8000/openapi.json

## API Endpoints

### Workflow Endpoints

#### `POST /api/workflow/encode`
Encode workflow trigger and action into bytes (no on-chain transaction)

**Request**:
```json
{
  "trigger_type": 1,
  "trigger_params": {"interval_seconds": 3600},
  "action_type": 1,
  "action_params": {
    "recipient": "0x...",
    "amount": 1000000000000000000
  }
}
```

**Response**:
```json
{
  "success": true,
  "trigger_data": "0x0000...",
  "action_data": "0x01000...",
  "trigger_type": 1,
  "action_type": 1
}
```

#### `POST /api/workflow/create`
Create workflow on-chain using relayer

**Request**:
```json
{
  "trigger_type": 1,
  "trigger_params": {"interval_seconds": 3600},
  "action_type": 1,
  "action_params": {
    "recipient": "0x...",
    "amount": 1000000000000000000
  },
  "next_run": 1234567890,
  "interval": 3600,
  "gas_budget": 500000000000000000,
  "user_address": "0x..."
}
```

**Response**:
```json
{
  "success": true,
  "tx_hash": "0x...",
  "message": "Workflow created successfully"
}
```

#### `GET /api/workflow/user/{address}`
Get all workflows owned by a user

**Response**:
```json
{
  "success": true,
  "count": 2,
  "workflows": [...]
}
```

#### `DELETE /api/workflow/{workflow_id}`
Delete (deactivate) a workflow

**Response**:
```json
{
  "success": true,
  "tx_hash": "0x...",
  "message": "Workflow #1 deleted successfully"
}
```

### Escrow Endpoints

#### `GET /api/escrow/balance/{address}`
Get user's gas balance in escrow

**Response**:
```json
{
  "success": true,
  "address": "0x...",
  "balance": 1000000000000000000,
  "balance_eth": 1.0
}
```

#### `POST /api/escrow/deposit`
Build deposit transaction for user to sign

**Request**:
```json
{
  "user_address": "0x...",
  "amount": 1000000000000000000
}
```

**Response**:
```json
{
  "success": true,
  "tx": {
    "to": "0x...",
    "value": "0x...",
    "data": "0x...",
    "nonce": "0x1",
    ...
  },
  "message": "Sign this transaction to deposit gas"
}
```

#### `POST /api/escrow/withdraw`
Build withdraw transaction for user to sign

### Price Endpoints

#### `GET /api/price/{symbol}`
Get current price for a cryptocurrency

**Response**:
```json
{
  "success": true,
  "symbol": "ETHEREUM",
  "price_usd": 3500.25
}
```

#### `GET /api/price/`
List supported assets

**Response**:
```json
{
  "success": true,
  "assets": ["ethereum", "bitcoin", "polkadot", ...]
}
```

### Utility Endpoints

#### `GET /api/utils/healthz`
Health check endpoint

**Response**:
```json
{
  "success": true,
  "status": "healthy",
  "web3_connected": true,
  "chain_id": 1287,
  "app": "Autometa Backend"
}
```

#### `GET /api/utils/trigger-types`
Get trigger type definitions

#### `GET /api/utils/action-types`
Get action type definitions

#### `GET /api/utils/contracts`
Get deployed contract addresses

## Trigger Types

### 1. TIME Trigger
Execute at fixed intervals

**Parameters**:
```json
{
  "interval_seconds": 3600  // Execute every hour
}
```

### 2. PRICE Trigger
Execute when price crosses threshold

**Parameters**:
```json
{
  "symbol": "ethereum",
  "threshold": 3500000000000000000000,  // $3500 * 1e18
  "direction": 1  // 0=BELOW, 1=ABOVE
}
```

### 3. WALLET_EVENT Trigger
Execute on balance changes

**Parameters**:
```json
{
  "token_address": "0x0000000000000000000000000000000000000000",  // 0x0 for native
  "event_type": 0  // 0=RECEIVED, 1=SENT, 2=BALANCE_CHANGE
}
```

## Action Types

### 1. NATIVE_TRANSFER
Transfer native currency (DEV on Moonbase)

**Parameters**:
```json
{
  "recipient": "0x...",
  "amount": 1000000000000000000  // 1 DEV in wei
}
```

### 2. ERC20_TRANSFER
Transfer ERC20 tokens

**Parameters**:
```json
{
  "token_address": "0x...",
  "recipient": "0x...",
  "amount": 1000000000000000000
}
```

### 3. CONTRACT_CALL
Execute arbitrary contract function

**Parameters**:
```json
{
  "target": "0x...",
  "value": 0,
  "calldata": "0x..."  // ABI-encoded function call
}
```

## Testing

### Run API Tests

```bash
# Start the backend first
./start.sh

# In another terminal
python test_api.py
```

### Manual Testing with curl

```bash
# Health check
curl http://localhost:8000/api/utils/healthz

# Get ETH price
curl http://localhost:8000/api/price/ethereum

# Encode workflow
curl -X POST http://localhost:8000/api/workflow/encode \
  -H "Content-Type: application/json" \
  -d '{
    "trigger_type": 1,
    "trigger_params": {"interval_seconds": 3600},
    "action_type": 1,
    "action_params": {
      "recipient": "0x1234567890123456789012345678901234567890",
      "amount": 1000000000000000000
    }
  }'
```

## Security

### Relayer Pattern
- **Backend signs**: Workflow creation transactions (using `RELAYER_PRIVATE_KEY`)
- **User signs**: Escrow deposit/withdraw transactions (client-side)

This ensures the backend can create workflows on behalf of users, but users maintain full control over their funds.

### Environment Variables
- Never commit `.env` with real private keys
- Use a dedicated relayer account with limited funds
- Rotate relayer keys periodically

## Integration with Worker

The worker service (`/worker`) uses these endpoints to:
1. Fetch workflow metadata: `GET /api/workflow/user/{address}`
2. Get current prices: `GET /api/price/{symbol}` (for price trigger evaluation)
3. Monitor health: `GET /api/utils/healthz`

## Contract Addresses (Moonbase Alpha)

- **WorkflowRegistry**: `0x87bb7A86E657f1dDd2e84946545b6686935E3a56`
- **ActionExecutor**: `0x1Cb45BceCC3f0CEd2875b49d4f6dd5543B2bD559`
- **FeeEscrow**: `0x6a4E6dA8A8B9C1a178d7B1E4EE1279653A806C7e`

## Troubleshooting

### "Failed to connect to Web3 provider"
- Check `MOONBASE_RPC` in `.env`
- Verify internet connection
- Try alternative RPC: `https://moonbeam-alpha.api.onfinality.io/public`

### "Import errors" in IDE
- These are false positives
- Packages are installed in `venv/`
- Code will run correctly

### "Redis connection failed"
- Price API will work but without caching
- Start Redis: `docker run -d -p 6379:6379 redis:7-alpine`

## Next Steps

1. **Update `.env`** with your relayer private key
2. **Start Redis** for price caching
3. **Start the backend**: `./start.sh`
4. **Test endpoints**: `python test_api.py`
5. **Integrate with frontend** (Phase 5)
