# Backend Quick Reference

## 🚀 Start Backend

```bash
cd backend
./start.sh
```

**Access**: http://localhost:8000  
**Docs**: http://localhost:8000/docs

## ⚙️ Configuration

### Required: Update Relayer Key
Edit `backend/.env`:
```bash
RELAYER_PRIVATE_KEY=your_actual_private_key_here
```

### Optional: Start Redis (Recommended)
```bash
docker run -d -p 6379:6379 redis:7-alpine
```

## 🧪 Testing

```bash
# Automated tests
python test_api.py

# Health check
curl http://localhost:8000/api/utils/healthz

# Get ETH price
curl http://localhost:8000/api/price/ethereum
```

## 📋 API Endpoints

### Workflow
- `POST /api/workflow/encode` - Encode workflow
- `POST /api/workflow/create` - Create on-chain
- `GET /api/workflow/user/{address}` - Get user workflows
- `DELETE /api/workflow/{id}` - Delete workflow

### Escrow
- `GET /api/escrow/balance/{address}` - Get balance
- `POST /api/escrow/deposit` - Build deposit tx
- `POST /api/escrow/withdraw` - Build withdraw tx

### Price
- `GET /api/price/{symbol}` - Get current price
- `GET /api/price/` - List supported assets

### Utils
- `GET /api/utils/healthz` - Health check
- `GET /api/utils/trigger-types` - Trigger definitions
- `GET /api/utils/action-types` - Action definitions
- `GET /api/utils/contracts` - Contract addresses

## 🔑 Trigger Types

| ID | Name | Description | Params |
|----|------|-------------|--------|
| 1 | TIME | Fixed intervals | `interval_seconds` |
| 2 | PRICE | Price threshold | `symbol`, `threshold`, `direction` |
| 3 | WALLET_EVENT | Balance changes | `token_address`, `event_type` |

## ⚡ Action Types

| ID | Name | Description | Params |
|----|------|-------------|--------|
| 1 | NATIVE_TRANSFER | Send DEV | `recipient`, `amount` |
| 2 | ERC20_TRANSFER | Send tokens | `token_address`, `recipient`, `amount` |
| 3 | CONTRACT_CALL | Call contract | `target`, `value`, `calldata` |

## 📝 Example: Create Workflow

```bash
curl -X POST http://localhost:8000/api/workflow/create \
  -H "Content-Type: application/json" \
  -d '{
    "trigger_type": 1,
    "trigger_params": {"interval_seconds": 3600},
    "action_type": 1,
    "action_params": {
      "recipient": "0xYourAddress",
      "amount": 1000000000000000000
    },
    "next_run": 1735000000,
    "interval": 3600,
    "gas_budget": 500000000000000000,
    "user_address": "0xYourAddress"
  }'
```

## 📦 Contract Addresses (Moonbase Alpha)

- **WorkflowRegistry**: `0x87bb7A86E657f1dDd2e84946545b6686935E3a56`
- **ActionExecutor**: `0x1Cb45BceCC3f0CEd2875b49d4f6dd5543B2bD559`
- **FeeEscrow**: `0x6a4E6dA8A8B9C1a178d7B1E4EE1279653A806C7e`

## 🐛 Troubleshooting

**Import errors**: False positives - code will run  
**Redis unavailable**: Backend will work but without price caching  
**Web3 connection failed**: Check RPC URL in `.env`

## 📚 Documentation

- Full API docs: http://localhost:8000/docs
- README: `backend/README.md`
- Implementation details: `backend/PHASE4_COMPLETE.md`
