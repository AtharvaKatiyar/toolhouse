# API Endpoints Quick Reference

## Base URL
```
http://localhost:8000
```

## 📚 Interactive Documentation
- **Swagger UI:** http://localhost:8000/docs
- **OpenAPI JSON:** http://localhost:8000/openapi.json

---

## 🔧 Utils Endpoints

### Health Check
```bash
curl http://localhost:8000/api/utils/healthz
```

**Response:**
```json
{
  "success": true,
  "status": "healthy",
  "web3_connected": true,
  "chain_id": 1287,
  "app": "Autometa Backend API"
}
```

---

### Get Contract Addresses
```bash
curl http://localhost:8000/api/utils/contracts
```

**Response:**
```json
{
  "WorkflowRegistry": "0x87bb7A86E657f1dDd2e84946545b6686935E3a56",
  "ActionExecutor": "0x1Cb45BceCC3f0CEd2875b49d4f6dd5543B2bD559",
  "FeeEscrow": "0x6a4E6dA8A8B9C1a178d7B1E4EE1279653A806C7e"
}
```

---

### Get Trigger Types
```bash
curl http://localhost:8000/api/utils/trigger-types
```

**Response:**
```json
{
  "trigger_types": {
    "0": "Manual",
    "1": "Time-based",
    "2": "Price-based",
    "3": "Wallet Event"
  }
}
```

---

### Get Action Types
```bash
curl http://localhost:8000/api/utils/action-types
```

**Response:**
```json
{
  "action_types": {
    "0": "Native Transfer",
    "1": "ERC20 Transfer",
    "2": "Contract Call"
  }
}
```

---

## 💰 Price Endpoints

### Get Price for Single Asset
```bash
curl http://localhost:8000/api/price/ethereum
```

**Response:**
```json
{
  "symbol": "ethereum",
  "price_usd": 3198.16,
  "source": "redis",
  "timestamp": "2025-11-15T23:25:00Z"
}
```

**Other assets:** bitcoin, polkadot, moonbeam, uniswap, chainlink, aave

---

### List Supported Assets
```bash
curl http://localhost:8000/api/price/
```

**Response:**
```json
{
  "supported_assets": [
    "ethereum",
    "bitcoin",
    "moonbeam",
    "polkadot",
    "uniswap",
    "chainlink",
    "aave"
  ]
}
```

---

## 💵 Escrow Endpoints

### Get User Escrow Balance
```bash
curl http://localhost:8000/api/escrow/balance/0x123...
```

**Response:**
```json
{
  "address": "0x123...",
  "balance_wei": "1000000000000000000",
  "balance_dev": "1.0"
}
```

---

### Build Deposit Transaction
```bash
curl -X POST http://localhost:8000/api/escrow/deposit \
  -H "Content-Type: application/json" \
  -d '{
    "user_address": "0x123...",
    "amount_wei": "1000000000000000000"
  }'
```

**Response:**
```json
{
  "success": true,
  "transaction": {
    "to": "0x6a4E6dA8A8B9C1a178d7B1E4EE1279653A806C7e",
    "data": "0x...",
    "value": "1000000000000000000",
    "chainId": 1287,
    "gas": 100000
  },
  "message": "Sign and send this transaction"
}
```

---

### Build Withdraw Transaction
```bash
curl -X POST http://localhost:8000/api/escrow/withdraw \
  -H "Content-Type: application/json" \
  -d '{
    "user_address": "0x123...",
    "amount_wei": "500000000000000000"
  }'
```

**Response:**
```json
{
  "success": true,
  "transaction": {
    "to": "0x6a4E6dA8A8B9C1a178d7B1E4EE1279653A806C7e",
    "data": "0x...",
    "value": "0",
    "chainId": 1287,
    "gas": 100000
  },
  "message": "Sign and send this transaction"
}
```

---

## 🔄 Workflow Endpoints

### Create Workflow (Price Trigger → Native Transfer)
```bash
curl -X POST http://localhost:8000/api/workflow/create \
  -H "Content-Type: application/json" \
  -d '{
    "user_address": "0x7235a755be3e1a5194c34683b6cF24FFB16D0CF1",
    "trigger_type": 2,
    "trigger_data": {
      "token": "ethereum",
      "comparator": 0,
      "price_usd": 3200.0
    },
    "action_type": 0,
    "action_data": {
      "to": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
      "amount_wei": "1000000000000000000"
    }
  }'
```

**Trigger Comparators:**
- `0` - Below (<)
- `1` - Below or Equal (<=)
- `2` - Above (>)
- `3` - Above or Equal (>=)

**Response:**
```json
{
  "success": true,
  "workflow_id": 5,
  "tx_hash": "0xabc...",
  "trigger_data_hex": "0x...",
  "action_data_hex": "0x...",
  "message": "Workflow created successfully"
}
```

---

### Create Workflow (Time Trigger → ERC20 Transfer)
```bash
curl -X POST http://localhost:8000/api/workflow/create \
  -H "Content-Type: application/json" \
  -d '{
    "user_address": "0x123...",
    "trigger_type": 1,
    "trigger_data": {
      "start_time": 1700000000,
      "interval": 86400
    },
    "action_type": 1,
    "action_data": {
      "token": "0xTokenAddress...",
      "to": "0x456...",
      "amount": "1000000000000000000"
    }
  }'
```

---

### Get User's Workflows
```bash
curl http://localhost:8000/api/workflow/user/0x7235a755be3e1a5194c34683b6cF24FFB16D0CF1
```

**Response:**
```json
{
  "user_address": "0x7235a755be3e1a5194c34683b6cF24FFB16D0CF1",
  "workflows": [
    {
      "id": 1,
      "owner": "0x7235a755be3e1a5194c34683b6cF24FFB16D0CF1",
      "active": true,
      "triggerType": 2,
      "actionType": 0,
      "triggerData": "0x...",
      "actionData": "0x..."
    }
  ],
  "count": 1
}
```

---

### Delete Workflow
```bash
curl -X DELETE http://localhost:8000/api/workflow/5
```

**Response:**
```json
{
  "success": true,
  "workflow_id": 5,
  "tx_hash": "0xdef...",
  "message": "Workflow deleted successfully"
}
```

---

### Encode Workflow (Preview)
```bash
curl -X POST http://localhost:8000/api/workflow/encode \
  -H "Content-Type: application/json" \
  -d '{
    "trigger_type": 2,
    "trigger_data": {
      "token": "ethereum",
      "comparator": 0,
      "price_usd": 3200.0
    },
    "action_type": 0,
    "action_data": {
      "to": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
      "amount_wei": "1000000000000000000"
    }
  }'
```

**Response:**
```json
{
  "trigger_data_hex": "0x000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002c68af0bb14000000000000000000000000000000000000000000000000000000000000000000008657468657265756d0000000000000000000000000000000000000000000000",
  "action_data_hex": "0x00000000000000000000000000742d35cc6634c0532925a3b844bc9e7595f0beb0000000000000000000000000000000000000000000000000de0b6b3a7640000"
}
```

---

## 🔍 Example Use Cases

### 1. Check if Backend is Running
```bash
curl http://localhost:8000/api/utils/healthz
```

### 2. Get Current Ethereum Price
```bash
curl http://localhost:8000/api/price/ethereum | python3 -m json.tool
```

### 3. Check Escrow Balance
```bash
curl http://localhost:8000/api/escrow/balance/0x7235a755be3e1a5194c34683b6cF24FFB16D0CF1 | python3 -m json.tool
```

### 4. List All Workflows for User
```bash
curl http://localhost:8000/api/workflow/user/0x7235a755be3e1a5194c34683b6cF24FFB16D0CF1 | python3 -m json.tool
```

### 5. Create Price Alert Workflow
```bash
# Alert when ETH drops below $3000
curl -X POST http://localhost:8000/api/workflow/create \
  -H "Content-Type: application/json" \
  -d '{
    "user_address": "0x7235a755be3e1a5194c34683b6cF24FFB16D0CF1",
    "trigger_type": 2,
    "trigger_data": {
      "token": "ethereum",
      "comparator": 0,
      "price_usd": 3000.0
    },
    "action_type": 0,
    "action_data": {
      "to": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
      "amount_wei": "100000000000000000"
    }
  }' | python3 -m json.tool
```

---

## ⚠️ Common Mistakes

### ❌ Wrong: `/api/workflows` (plural)
```bash
curl http://localhost:8000/api/workflows
# Error: {"detail": "Not Found"}
```

### ✅ Correct: `/api/workflow/user/{address}`
```bash
curl http://localhost:8000/api/workflow/user/0x123...
```

---

### ❌ Wrong: `/api/escrow` (no parameter)
```bash
curl http://localhost:8000/api/escrow
# Error: {"detail": "Not Found"}
```

### ✅ Correct: `/api/escrow/balance/{address}`
```bash
curl http://localhost:8000/api/escrow/balance/0x123...
```

---

### ❌ Wrong: `/api/util` (singular)
```bash
curl http://localhost:8000/api/util
# Error: {"detail": "Not Found"}
```

### ✅ Correct: `/api/utils/healthz`
```bash
curl http://localhost:8000/api/utils/healthz
```

---

## 📖 Full Documentation

Visit the interactive API docs:
```
http://localhost:8000/docs
```

This provides:
- ✅ Full endpoint documentation
- ✅ Request/response schemas
- ✅ Try it out feature
- ✅ Authentication details
- ✅ Example values

---

## 🧪 Testing

Run the backend test suite:
```bash
cd /home/mime/Desktop/autometa/backend
source venv/bin/activate
python test_api.py
```

Run worker integration tests:
```bash
cd /home/mime/Desktop/autometa/worker
source venv/bin/activate
python test_backend_integration.py
```

---

## 🔗 Quick Links

- **API Docs:** http://localhost:8000/docs
- **Health Check:** http://localhost:8000/api/utils/healthz
- **Contracts:** http://localhost:8000/api/utils/contracts
- **Supported Assets:** http://localhost:8000/api/price/

---

**Last Updated:** November 15, 2025
