# 🔄 ABI Sync Automation

This document explains how to keep contract ABIs synchronized between the Hardhat project and the Python worker.

---

## 📋 What is ABI Syncing?

When you compile or modify smart contracts, Hardhat generates new ABI (Application Binary Interface) files. The Python worker needs these ABIs to interact with the deployed contracts.

**ABI files contain:**
- Function signatures (names, inputs, outputs)
- Event definitions
- Contract bytecode
- Error definitions

---

## 🛠️ How to Sync ABIs

### Method 1: Using the Sync Script (Recommended)

Run the automated sync script from the project root:

```bash
./sync-abis.sh
```

### Method 2: Using npm Scripts

From the `contracts/` directory:

```bash
# Compile and sync ABIs automatically
npm run compile:sync

# Or just sync ABIs without recompiling
npm run sync-abi
```

### Method 3: Compile + Deploy + Sync (All-in-one)

```bash
# Deploy to Moonbase Alpha and sync ABIs
npm run deploy:sync
```

---

## 🔄 When to Sync ABIs

You **MUST** sync ABIs whenever you:

✅ Modify any smart contract code
✅ Add new functions to contracts
✅ Add or modify events
✅ Change function parameters
✅ Recompile contracts after changes
✅ Deploy new versions of contracts

---

## 📂 What Gets Synced

The script copies these files:

```
contracts/artifacts/contracts/
├── ActionExecutor.sol/ActionExecutor.json    →  worker/abi/ActionExecutor.json
├── FeeEscrow.sol/FeeEscrow.json             →  worker/abi/FeeEscrow.json
└── WorkflowRegistry.sol/WorkflowRegistry.json →  worker/abi/WorkflowRegistry.json
```

---

## ⚙️ Automatic Sync Workflows

### Workflow 1: Development Cycle

```bash
# 1. Modify contract
vim contracts/contracts/WorkflowRegistry.sol

# 2. Compile and sync in one command
cd contracts
npm run compile:sync
```

### Workflow 2: Deploy and Sync

```bash
# Deploy to Moonbase Alpha and auto-sync ABIs
cd contracts
npm run deploy:sync
```

### Workflow 3: Manual Sync

```bash
# Just sync without compiling or deploying
cd contracts
npm run sync-abi
```

---

## 🚨 Important Notes

### After Syncing ABIs:

1. **Update Contract Addresses** in `worker/.env`:
   ```env
   WORKFLOW_REGISTRY_ADDRESS=0x...  # From deployment
   FEE_ESCROW_ADDRESS=0x...
   ACTION_EXECUTOR_ADDRESS=0x...
   ```

2. **Restart the Python Worker** if it's running:
   ```bash
   # If running with Docker
   docker restart autometa-worker

   # If running directly
   pkill -f "python src/main.py"
   cd worker && python src/main.py
   ```

3. **Test the Worker** to ensure it can interact with contracts:
   ```bash
   cd worker
   python -c "from src.utils.web3_provider import Web3Provider; print('✓ ABIs loaded successfully')"
   ```

---

## 📝 Script Details

### What the Script Does:

1. ✅ Checks if contracts are compiled
2. ✅ Creates `worker/abi/` directory if needed
3. ✅ Copies all 3 contract ABIs
4. ✅ Verifies file sizes
5. ✅ Shows deployment addresses (if available)
6. ✅ Provides next steps

### Error Handling:

- **Contracts not compiled**: Prompts you to run `npm run compile`
- **Missing ABIs**: Shows which files are missing
- **Partial success**: Reports which files succeeded/failed

---

## 🔍 Verification

After syncing, verify the ABIs are in place:

```bash
ls -lh worker/abi/
```

Expected output:
```
ActionExecutor.json     25K
FeeEscrow.json         23K
WorkflowRegistry.json  39K
```

---

## 🐛 Troubleshooting

### Problem: "Contracts not compiled" error

**Solution:**
```bash
cd contracts
npm run compile
cd ..
./sync-abis.sh
```

### Problem: ABIs are old/stale

**Solution:**
```bash
cd contracts
npm run clean      # Clean old artifacts
npm run compile    # Recompile
npm run sync-abi   # Sync new ABIs
```

### Problem: Worker can't find ABIs

**Solution:**
```bash
# Check if ABIs exist
ls worker/abi/

# If missing, run sync
./sync-abis.sh

# Verify Python can load them
cd worker
python -c "import json; print(json.load(open('abi/ActionExecutor.json'))['abi'][0])"
```

### Problem: Permission denied

**Solution:**
```bash
chmod +x sync-abis.sh
./sync-abis.sh
```

---

## 🎯 Best Practices

1. **Always sync after modifying contracts**
   ```bash
   # Good workflow
   edit contracts → npm run compile:sync → npm run deploy:sync
   ```

2. **Keep ABIs version-controlled** (they're tracked in git)
   ```bash
   git add worker/abi/*.json
   git commit -m "Update ABIs after contract changes"
   ```

3. **Document ABI changes** in your commits
   ```bash
   git commit -m "Add executeMultiple function to ActionExecutor

   - Updated ActionExecutor.sol with batch execution
   - Synced ABIs to worker folder
   - Updated worker to use new function"
   ```

4. **Test after syncing**
   ```bash
   # Run worker tests to ensure ABIs work
   cd worker
   python -m pytest tests/
   ```

---

## 📊 Quick Reference

| Command | Description |
|---------|-------------|
| `./sync-abis.sh` | Sync ABIs from project root |
| `npm run sync-abi` | Sync ABIs from contracts/ |
| `npm run compile:sync` | Compile + sync |
| `npm run deploy:sync` | Deploy + sync |
| `ls worker/abi/` | List synced ABIs |

---

## 🔗 Related Documentation

- **Deployment Guide**: `contracts/DEPLOYMENT_GUIDE.md`
- **Worker Setup**: `worker/README.md` (to be created)
- **Smart Contracts**: `contracts/README.md`

---

**Remember**: Keeping ABIs in sync is crucial for the worker to function correctly! 🔄
