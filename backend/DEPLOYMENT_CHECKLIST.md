# Backend Deployment Checklist

## ✅ Pre-Deployment Setup

### 1. Environment Configuration
- [ ] Open `backend/.env`
- [ ] Replace `RELAYER_PRIVATE_KEY=your_private_key_here_without_0x_prefix` with actual private key
- [ ] Verify RPC URL: `https://rpc.api.moonbase.moonbeam.network`
- [ ] Verify contract addresses match deployment

### 2. Relayer Account Setup
- [ ] Export private key from MetaMask (or generate new account)
- [ ] Add account to Moonbase Alpha network
- [ ] Get DEV tokens from faucet: https://faucet.moonbeam.network/
- [ ] Verify balance: Should have at least 5 DEV for gas
- [ ] Grant WORKER_ROLE to relayer address (if not done in Phase 3)

### 3. Dependencies
- [ ] Virtual environment created: `python3 -m venv venv`
- [ ] Dependencies installed: `pip install -r requirements.txt`
- [ ] Redis running (optional): `docker run -d -p 6379:6379 redis:7-alpine`

## 🚀 First Run

### 4. Start Backend
- [ ] Navigate to backend directory: `cd backend`
- [ ] Make startup script executable: `chmod +x start.sh`
- [ ] Start backend: `./start.sh`
- [ ] Verify startup logs show "Connected to chain ID: 1287"
- [ ] Check for any error messages

### 5. Verify Endpoints
- [ ] Open browser to http://localhost:8000
- [ ] Should see API info page
- [ ] Open http://localhost:8000/docs
- [ ] Should see Swagger UI with all endpoints

### 6. Health Check
```bash
curl http://localhost:8000/api/utils/healthz
```
Expected response:
```json
{
  "success": true,
  "status": "healthy",
  "web3_connected": true,
  "chain_id": 1287,
  "app": "Autometa Backend"
}
```

## 🧪 Testing

### 7. Run Automated Tests
```bash
# In a new terminal (keep backend running)
cd backend
source venv/bin/activate
python test_api.py
```

Expected output:
```
=== Testing Health Check ===
Status: 200
Response: {...}

=== Testing Trigger Types ===
Status: 200
Trigger Types: ['1', '2', '3']

=== Testing Workflow Encoding ===
Status: 200
Trigger Data: 0x0000...
Action Data: 0x01000...

=== Testing Price API ===
Status: 200
ETH Price: $3500.25

=== Testing Escrow Balance ===
Status: 200
Balance: 0 wei (0.0 DEV)

✅ All tests completed!
```

### 8. Manual API Tests

**Test workflow encoding**:
```bash
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
- [ ] Status: 200
- [ ] Response has `trigger_data` and `action_data` fields
- [ ] Both are hex strings starting with `0x`

**Test price API**:
```bash
curl http://localhost:8000/api/price/ethereum
```
- [ ] Status: 200
- [ ] Response has `price_usd` field with current ETH price

**Test contract addresses**:
```bash
curl http://localhost:8000/api/utils/contracts
```
- [ ] Status: 200
- [ ] Shows all 3 contract addresses
- [ ] Addresses match your deployment

## 🔐 Security Checklist

### 9. Security Verification
- [ ] `.env` file is NOT committed to git (check `.gitignore`)
- [ ] Relayer private key is from dedicated account (not your main wallet)
- [ ] Relayer account has limited DEV balance (5-10 DEV max)
- [ ] CORS origins configured correctly (only your frontend domains)
- [ ] Backend not exposed to public internet (use reverse proxy for production)

## 📊 Integration Testing

### 10. Worker Integration (If Phase 3 Worker Running)
- [ ] Worker can fetch workflows: `GET /api/workflow/user/{address}`
- [ ] Worker can fetch prices: `GET /api/price/{symbol}`
- [ ] Worker logs show successful API calls
- [ ] No connection errors in worker logs

### 11. Create Test Workflow
```bash
# Replace 0xYourAddress with your actual address
curl -X POST http://localhost:8000/api/workflow/create \
  -H "Content-Type: application/json" \
  -d '{
    "trigger_type": 1,
    "trigger_params": {"interval_seconds": 3600},
    "action_type": 1,
    "action_params": {
      "recipient": "0xYourAddress",
      "amount": 100000000000000000
    },
    "next_run": '$(date +%s)',
    "interval": 3600,
    "gas_budget": 500000000000000000,
    "user_address": "0xYourAddress"
  }'
```

- [ ] Status: 200
- [ ] Response has `tx_hash` field
- [ ] Transaction confirmed on Moonbase Alpha
- [ ] View on explorer: https://moonbase.moonscan.io/tx/{tx_hash}

### 12. Verify Workflow On-Chain
```bash
curl http://localhost:8000/api/workflow/user/0xYourAddress
```
- [ ] Status: 200
- [ ] Shows workflow created in step 11
- [ ] Workflow details are correct (trigger, action, interval)

## 📝 Documentation Checklist

### 13. Documentation Review
- [ ] Read `backend/README.md` - Complete API documentation
- [ ] Read `backend/PHASE4_COMPLETE.md` - Implementation details
- [ ] Read `backend/QUICK_START.md` - Quick reference
- [ ] Bookmark Swagger UI: http://localhost:8000/docs

## 🎯 Production Readiness (Optional)

### 14. Production Preparation
- [ ] Set up proper logging (file-based, not just stdout)
- [ ] Configure environment-specific settings (dev/staging/prod)
- [ ] Set up monitoring (Prometheus, Grafana)
- [ ] Configure rate limiting
- [ ] Set up HTTPS with SSL certificate
- [ ] Use process manager (systemd, PM2, or Docker)
- [ ] Set up database for workflow metadata (PostgreSQL)
- [ ] Implement authentication (JWT tokens)
- [ ] Set up CI/CD pipeline
- [ ] Create Docker image: `docker build -t autometa-backend .`

## ✅ Final Verification

### 15. Complete System Test
- [ ] Backend running: http://localhost:8000
- [ ] Health check passes
- [ ] Can encode workflows
- [ ] Can create workflows on-chain
- [ ] Can query user workflows
- [ ] Can fetch prices
- [ ] Can query escrow balances
- [ ] All automated tests pass
- [ ] No errors in backend logs

## 🎉 Success Criteria

When all items are checked:
- ✅ Backend is running and accessible
- ✅ All API endpoints respond correctly
- ✅ Can create workflows on-chain
- ✅ Integration with smart contracts works
- ✅ Price feeds are functional
- ✅ Automated tests pass

**You are ready to proceed to Phase 5: Frontend Development!**

## 📞 Need Help?

Common issues and solutions:

**"Failed to connect to Web3 provider"**
- Check internet connection
- Verify RPC URL in `.env`
- Try alternative RPC: `https://moonbeam-alpha.api.onfinality.io/public`

**"Import errors" in code**
- These are false positives from the linter
- Code will run correctly
- Ignore these warnings

**"Redis connection failed"**
- Redis is optional
- Backend will work without it
- To fix: `docker run -d -p 6379:6379 redis:7-alpine`

**"Transaction reverted" when creating workflow**
- Check relayer has DEV balance
- Verify relayer has WORKER_ROLE
- Check contract addresses in `.env`

**Workflow creation succeeds but worker doesn't execute**
- Verify worker is running
- Check worker has proper permissions
- Verify gas escrow has sufficient balance
- Check worker logs for errors
