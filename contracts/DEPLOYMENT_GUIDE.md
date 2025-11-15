# 🚀 Deployment Instructions - Moonbeam

This guide covers deploying to both **Moonbase Alpha (testnet)** and **Moonbeam (mainnet)**.

---

## 🧪 Part 1: Deploy to Moonbase Alpha (Testnet) - RECOMMENDED FIRST

### Step 1: Set Up Environment

```bash
cd /home/mime/Desktop/autometa/contracts

# .env file is already created, now edit it
nano .env  # or use: code .env
```

### Step 2: Add Your Private Key

Edit the `.env` file and replace `your_private_key_here` with your actual private key:

```env
# IMPORTANT: Remove the 0x prefix from your private key
PRIVATE_KEY=your_actual_private_key_without_0x

# Moonbase Alpha RPC (already configured)
MOONBASE_RPC_URL=https://rpc.api.moonbase.moonbeam.network

# Optional: Moonscan API key for contract verification
MOONSCAN_API_KEY=your_moonscan_api_key_here
```

**⚠️ Security Note**: 
- Never commit `.env` file to git (it's already in `.gitignore`)
- Use a separate wallet for testnet with only test tokens

### Step 3: Get Testnet Tokens (DEV)

1. **Visit the faucet**: https://faucet.moonbeam.network/
2. **Connect your wallet** or paste your address
3. **Request DEV tokens** (you'll get 1 DEV - plenty for testing)
4. **Wait ~30 seconds** for tokens to arrive

### Step 4: Check Your Balance

```bash
npm run balance -- --network moonbaseAlpha
```

Expected output:
```
Network: moonbaseAlpha
Account: 0x1234...
Balance: 1.0 DEV
✅ Balance is sufficient for deployment
```

### Step 5: Compile Contracts

```bash
npm run compile
```

### Step 6: Run Tests (Optional but Recommended)

```bash
npm test
```

You should see: `50 passing ✓`

### Step 7: Deploy to Moonbase Alpha (Testnet)

```bash
npm run deploy:moonbase
```

Expected output:
```
Starting deployment...
Deploying contracts with account: 0x...
Account balance: 1.0 DEV

1. Deploying WorkflowRegistry...
WorkflowRegistry deployed to: 0xABCD...

2. Deploying FeeEscrow...
FeeEscrow deployed to: 0xEF01...

3. Deploying ActionExecutor...
ActionExecutor deployed to: 0x2345...

4. Configuring roles...
Granted WORKER_ROLE to ActionExecutor in FeeEscrow
Granted PROJECT_ADMIN to deployer in WorkflowRegistry

✅ Deployment completed successfully!

📋 Contract Addresses:
═══════════════════════════════════════════════
WorkflowRegistry: 0xABCD...
FeeEscrow:        0xEF01...
ActionExecutor:   0x2345...
═══════════════════════════════════════════════

💾 Deployment info saved to: deployments/moonbaseAlpha-<timestamp>.json
```

### Step 8: Verify Contracts on Moonscan (Optional)

Get a free API key from https://moonscan.io/apis, add it to `.env`, then:

```bash
# Get the addresses from the deployment output above
npx hardhat verify --network moonbaseAlpha <WORKFLOW_REGISTRY_ADDRESS> "<YOUR_ADDRESS>"
npx hardhat verify --network moonbaseAlpha <FEE_ESCROW_ADDRESS> "<YOUR_ADDRESS>"
npx hardhat verify --network moonbaseAlpha <ACTION_EXECUTOR_ADDRESS> "<YOUR_ADDRESS>" "<REGISTRY_ADDRESS>" "<ESCROW_ADDRESS>"
```

### Step 9: View Your Contracts

Visit **Moonbase Moonscan**: https://moonbase.moonscan.io/
- Search for your contract addresses
- View transactions
- Interact with verified contracts

---

## 🌐 Part 2: Deploy to Moonbeam (Mainnet) - When Ready for Production

### Prerequisites for Mainnet

- [ ] Successfully tested on Moonbase Alpha
- [ ] Contracts audited (recommended for production)
- [ ] GLMR tokens for gas (buy on exchanges like Binance, Kraken, etc.)
- [ ] Hardware wallet recommended for large deployments
- [ ] Team reviewed the deployment

### Step 1: Get GLMR Tokens

You'll need GLMR tokens for gas on Moonbeam mainnet:

1. **Buy GLMR** from exchanges:
   - Binance
   - Kraken
   - KuCoin
   - Gate.io

2. **Transfer to your deployment wallet**
   - Minimum recommended: 5-10 GLMR for deployment + operations

### Step 2: Verify Your Balance

```bash
npm run balance -- --network moonbeam
```

Expected output:
```
Network: moonbeam
Account: 0x1234...
Balance: 10.0 GLMR
✅ Balance is sufficient for deployment
```

### Step 3: Check Network Info

```bash
npm run info -- --network moonbeam
```

This shows you're connected to the right network (Chain ID 1284).

### Step 4: Deploy to Moonbeam Mainnet

```bash
npm run deploy:moonbeam
```

**⚠️ IMPORTANT**: This will deploy to mainnet and use real GLMR tokens!

### Step 5: Verify Contracts on Moonscan

```bash
npx hardhat verify --network moonbeam <WORKFLOW_REGISTRY_ADDRESS> "<YOUR_ADDRESS>"
npx hardhat verify --network moonbeam <FEE_ESCROW_ADDRESS> "<YOUR_ADDRESS>"
npx hardhat verify --network moonbeam <ACTION_EXECUTOR_ADDRESS> "<YOUR_ADDRESS>" "<REGISTRY_ADDRESS>" "<ESCROW_ADDRESS>"
```

### Step 6: View on Moonbeam Moonscan

Visit **Moonbeam Moonscan**: https://moonbeam.moonscan.io/
- Your contracts are now live on mainnet!
- Monitor transactions and activity

---

## 📊 Quick Reference: Testnet vs Mainnet

| Feature | Moonbase Alpha (Testnet) | Moonbeam (Mainnet) |
|---------|--------------------------|-------------------|
| **Command** | `npm run deploy:moonbase` | `npm run deploy:moonbeam` |
| **Chain ID** | 1287 | 1284 |
| **Token** | DEV (free) | GLMR (costs money) |
| **Faucet** | https://faucet.moonbeam.network/ | None (buy GLMR) |
| **Explorer** | https://moonbase.moonscan.io/ | https://moonbeam.moonscan.io/ |
| **Purpose** | Testing & development | Production |
| **Network Flag** | `--network moonbaseAlpha` | `--network moonbeam` |
| **Verification** | `npm run verify:moonbase` | `npm run verify:moonbeam` |

---

## 🔧 Useful Commands

### For Moonbase Alpha (Testnet)
```bash
# Check balance
npm run balance -- --network moonbaseAlpha

# Network info
npm run info -- --network moonbaseAlpha

# Deploy
npm run deploy:moonbase

# Verify
npm run verify:moonbase -- <ADDRESS> <ARGS>
```

### For Moonbeam (Mainnet)
```bash
# Check balance
npm run balance -- --network moonbeam

# Network info
npm run info -- --network moonbeam

# Deploy
npm run deploy:moonbeam

# Verify
npm run verify:moonbeam -- <ADDRESS> <ARGS>
```

---

## 📁 Deployment Files

After deployment, check these files:

```bash
# Testnet deployment
cat deployments/moonbaseAlpha-<timestamp>.json

# Mainnet deployment
cat deployments/moonbeam-<timestamp>.json
```

Each contains:
- Contract addresses
- Deployer address
- Network name
- Deployment timestamp

---

## 🛡️ Security Checklist

### For Testnet
- [ ] Using separate wallet for testing
- [ ] Only test tokens at risk
- [ ] `.env` file not committed to git

### For Mainnet
- [ ] Contracts audited by professionals
- [ ] Tested thoroughly on Moonbase Alpha
- [ ] Using hardware wallet (Ledger/Trezor recommended)
- [ ] Team reviewed deployment plan
- [ ] Backup of private keys in secure location
- [ ] Multi-sig wallet for admin functions (recommended)
- [ ] Emergency pause mechanisms tested
- [ ] Monitoring and alerting set up

---

## 🆘 Troubleshooting

### "Insufficient funds for gas"
```bash
# Check your balance
npm run balance -- --network moonbaseAlpha  # or --network moonbeam

# For testnet: Get more DEV from faucet
# For mainnet: Buy more GLMR
```

### "Invalid nonce" error
```bash
# Clear cache and try again
npm run clean
rm -rf cache artifacts
npm run compile
```

### "Network not found"
```bash
# Verify network configuration
npm run info -- --network moonbaseAlpha
```

### Deployment fails partway through
- Check the `deployments/` folder for partial deployment
- Note which contracts were deployed
- You may need to deploy remaining contracts individually

---

## 🎯 Recommended Deployment Flow

1. ✅ **Start with Moonbase Alpha** (testnet)
   - Free tokens
   - No risk
   - Perfect for testing

2. ✅ **Test thoroughly**
   - Create workflows
   - Test all functions
   - Monitor gas costs

3. ✅ **Get audit** (for mainnet)
   - Recommended for production
   - Identify security issues

4. ✅ **Deploy to Moonbeam** (mainnet)
   - Only when fully tested
   - Use hardware wallet
   - Have monitoring ready

---

## 📞 Support

- **Moonbeam Discord**: https://discord.gg/moonbeam
- **Moonbeam Docs**: https://docs.moonbeam.network/
- **Project Docs**: See `MOONBEAM_DEPLOYMENT.md` and `QUICK_START_MOONBEAM.md`

---

**Ready to deploy?** Start with Moonbase Alpha testnet! 🚀

```bash
npm run deploy:moonbase
```
