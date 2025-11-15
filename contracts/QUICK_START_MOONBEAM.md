# 🌙 Quick Start - Moonbeam Deployment

Get your Autometa contracts deployed on Moonbeam in 5 minutes!

## ⚡ TL;DR

\`\`\`bash
# 1. Setup
cp .env.example .env
# Edit .env with your PRIVATE_KEY

# 2. Get testnet tokens
# Visit: https://faucet.moonbeam.network/

# 3. Deploy to testnet
npm run deploy:moonbase

# 4. Done! 🎉
\`\`\`

## 📋 Prerequisites Checklist

- [ ] Node.js installed (v16+)
- [ ] MetaMask or compatible wallet
- [ ] Private key (for deployment)
- [ ] DEV tokens (from faucet for testnet)

## 🚀 Step-by-Step Guide

### Step 1: Environment Setup

\`\`\`bash
# Copy environment template
cp .env.example .env

# Edit .env file
nano .env  # or use your preferred editor
\`\`\`

Add your private key (without 0x prefix):
\`\`\`
PRIVATE_KEY=your_private_key_here
MOONSCAN_API_KEY=optional_for_verification
\`\`\`

### Step 2: Get Testnet Tokens

1. Visit **https://faucet.moonbeam.network/**
2. Connect your wallet
3. Request DEV tokens (free!)
4. Wait for confirmation

### Step 3: Check Your Balance

\`\`\`bash
npm run balance -- --network moonbaseAlpha
\`\`\`

Expected output:
\`\`\`
Network: moonbaseAlpha
Account: 0x1234...
Balance: 10.0 DEV
✅ Balance is sufficient for deployment
\`\`\`

### Step 4: Deploy Contracts

\`\`\`bash
npm run deploy:moonbase
\`\`\`

This will deploy:
1. **WorkflowRegistry** - Manages workflows
2. **FeeEscrow** - Handles gas payments
3. **ActionExecutor** - Executes actions

### Step 5: Save Deployment Addresses

Deployment info is automatically saved to:
\`\`\`
deployments/moonbaseAlpha-<timestamp>.json
\`\`\`

### Step 6: Verify Contracts (Optional but Recommended)

\`\`\`bash
# Get addresses from deployment output, then:
npx hardhat verify --network moonbaseAlpha <REGISTRY_ADDRESS> "<ADMIN_ADDRESS>"
npx hardhat verify --network moonbaseAlpha <ESCROW_ADDRESS> "<ADMIN_ADDRESS>"
npx hardhat verify --network moonbaseAlpha <EXECUTOR_ADDRESS> "<ADMIN_ADDRESS>" "<REGISTRY_ADDRESS>" "<ESCROW_ADDRESS>"
\`\`\`

## 🎯 Network Information

\`\`\`bash
npm run info -- --network moonbaseAlpha
\`\`\`

## 📝 Useful Commands

\`\`\`bash
# Compile contracts
npm run compile

# Run tests
npm test

# Check balance
npm run balance -- --network moonbaseAlpha

# Network info
npm run info -- --network moonbaseAlpha

# Clean build artifacts
npm run clean
\`\`\`

## 🌐 Moonbeam Networks

| Network | Command | Token | Use Case |
|---------|---------|-------|----------|
| Moonbase Alpha | \`npm run deploy:moonbase\` | DEV | Testing (FREE tokens) |
| Moonriver | \`npm run deploy:moonriver\` | MOVR | Kusama production |
| Moonbeam | \`npm run deploy:moonbeam\` | GLMR | Polkadot production |

## ⚠️ Common Issues & Solutions

### Issue: "Insufficient funds for gas"
**Solution:** Get more DEV tokens from https://faucet.moonbeam.network/

### Issue: "Invalid nonce"
**Solution:**
\`\`\`bash
npm run clean
rm -rf cache artifacts
npm run compile
\`\`\`

### Issue: "Cannot find module"
**Solution:**
\`\`\`bash
npm install
\`\`\`

### Issue: Contract verification fails
**Solution:**
- Wait 1-2 minutes after deployment
- Ensure constructor args match exactly
- Get Moonscan API key from https://moonscan.io/apis

## 🔒 Security Reminders

✅ **DO:**
- Keep `.env` file secret
- Use hardware wallet for mainnet
- Test on Moonbase Alpha first
- Verify contracts on Moonscan

❌ **DON'T:**
- Commit `.env` to git
- Share your private key
- Deploy to mainnet without testing
- Use production keys for testing

## 📚 Next Steps

After deployment:

1. **Test Integration**
   - Create a test workflow
   - Deposit gas to FeeEscrow
   - Execute a workflow

2. **Monitor Contracts**
   - View on Moonscan
   - Set up event monitoring
   - Check transaction history

3. **Production Deployment**
   - Audit contracts
   - Deploy to Moonbeam/Moonriver
   - Set up monitoring alerts

## 🆘 Need Help?

- **Documentation**: [MOONBEAM_DEPLOYMENT.md](MOONBEAM_DEPLOYMENT.md)
- **Setup Guide**: [MOONBEAM_SETUP.md](MOONBEAM_SETUP.md)
- **Moonbeam Docs**: https://docs.moonbeam.network/
- **Discord**: https://discord.gg/moonbeam

## ✅ Success Criteria

You've successfully deployed when you see:

\`\`\`
✅ Deployment completed successfully!

📋 Contract Addresses:
═══════════════════════════════════════════════
WorkflowRegistry: 0xabcd...
FeeEscrow:        0xef01...
ActionExecutor:   0x2345...
═══════════════════════════════════════════════
\`\`\`

**Congratulations! 🎉 Your contracts are live on Moonbeam!**

---

For detailed documentation, see:
- [MOONBEAM_DEPLOYMENT.md](MOONBEAM_DEPLOYMENT.md) - Complete deployment guide
- [MOONBEAM_SETUP.md](MOONBEAM_SETUP.md) - Configuration details
- [README.md](README.md) - General project overview
