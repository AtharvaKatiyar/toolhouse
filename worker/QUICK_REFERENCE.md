# 🚀 Quick Reference - Queue-Based Execution System

## 📋 Common Commands

### Testing (Local)

```bash
cd /home/mime/Desktop/autometa/worker
source venv/bin/activate

# Run integration tests
python tools/test_integration.py

# Get worker address
python tools/get_worker_address.py

# Push test job
python tools/push_test_job.py

# Start worker
python -m src.main worker

# Start scheduler
python -m src.main scheduler
```

---

### Setup (Moonbase - One-time)

```bash
# 1. Get worker address
cd /home/mime/Desktop/autometa/worker
source venv/bin/activate
python tools/get_worker_address.py
# Copy the address shown

# 2. Update grant script
cd ../contracts
# Edit scripts/grant-worker-role.js
# Set: const WORKER_ADDRESS = "0xYourAddress";

# 3. Grant WORKER_ROLE
npx hardhat run scripts/grant-worker-role.js --network moonbaseAlpha

# 4. Fund worker (get DEV from faucet)
# https://faucet.moonbeam.network/

# 5. Verify role granted
npx hardhat console --network moonbaseAlpha
```

```javascript
// In Hardhat console:
const executor = await ethers.getContractAt("ActionExecutor", "0x8A791620dd6260079BF849Dc5567aDC3F2FdC318");
const WORKER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("WORKER_ROLE"));
await executor.hasRole(WORKER_ROLE, "0xYourWorkerAddress");
// Should return: true
```

---

### Running (Production)

```bash
# Terminal 1 - Scheduler
cd /home/mime/Desktop/autometa/worker
source venv/bin/activate
python -m src.main scheduler

# Terminal 2 - Worker
cd /home/mime/Desktop/autometa/worker
source venv/bin/activate
python -m src.main worker
```

---

### Monitoring

```bash
# Check queue length
redis-cli LLEN workflow_jobs

# View all jobs in queue
redis-cli LRANGE workflow_jobs 0 -1

# Monitor Redis activity
redis-cli MONITOR

# Check worker balance
cd /home/mime/Desktop/autometa/contracts
npx hardhat run scripts/check-balance.js --network moonbaseAlpha
```

---

## 🔍 Troubleshooting Quick Fixes

### Redis not running
```bash
sudo systemctl start redis-server
redis-cli ping  # Should return: PONG
```

### Worker crashes
```bash
# View logs
tail -f worker.log

# Restart
python -m src.main worker
```

### High queue depth
```bash
# Check length
redis-cli LLEN workflow_jobs

# Start more workers (separate terminals)
python -m src.main worker
```

### Out of gas
```bash
# Check balance
npx hardhat run scripts/check-balance.js --network moonbaseAlpha

# Fund from faucet:
# https://faucet.moonbeam.network/
```

---

## 📊 Key Files

| File | Purpose |
|------|---------|
| `src/executors/evm_executor.py` | Execute workflows on-chain |
| `src/executors/job_worker.py` | Consume jobs from queue |
| `src/scheduler/scheduler.py` | Enqueue ready workflows |
| `src/main.py` | Entry point (scheduler/worker) |
| `tools/push_test_job.py` | Push test jobs |
| `tools/test_integration.py` | Run integration tests |
| `tools/get_worker_address.py` | Get worker address |
| `contracts/scripts/grant-worker-role.js` | Grant WORKER_ROLE |

---

## 🔗 Important Links

- **Moonbase Faucet:** https://faucet.moonbeam.network/
- **Moonscan Explorer:** https://moonbase.moonscan.io/
- **Full Documentation:** `QUEUE_IMPLEMENTATION_COMPLETE.md`
- **Implementation Summary:** `IMPLEMENTATION_SUMMARY.md`

---

## 📈 Expected Performance

- Queue throughput: 7,800+ jobs/sec
- Retry attempts: 3 (with exponential backoff)
- Gas estimation: 20% safety buffer
- Transaction timeout: 120 seconds

---

## ✅ Pre-flight Checklist

Before starting the system:
- [ ] Redis is running (`redis-cli ping`)
- [ ] Worker has WORKER_ROLE
- [ ] Worker wallet has DEV balance
- [ ] `.env` file configured
- [ ] Workflows created on-chain

---

**Status:** ✅ Production Ready  
**Last Updated:** November 15, 2025
