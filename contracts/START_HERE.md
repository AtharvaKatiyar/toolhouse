# 🎯 START HERE - Autometa Moonbeam Deployment

**Welcome!** This is your complete guide to deploying Autometa smart contracts on Moonbeam.

---

## 🚀 Quick Start (5 Minutes)

### For Testnet (Moonbase Alpha) - FREE

```bash
# 1. Edit environment file with your private key
nano .env

# 2. Get free testnet tokens
# Visit: https://faucet.moonbeam.network/

# 3. Check your balance
npm run balance -- --network moonbaseAlpha

# 4. Deploy!
npm run deploy:moonbase
```

### For Mainnet (Moonbeam) - Production

```bash
# Make sure you have GLMR tokens first!
npm run balance -- --network moonbeam
npm run deploy:moonbeam
```

---

## �� Complete Documentation

| Document | Purpose | When to Use |
|----------|---------|-------------|
| **CHECKLIST.md** | Step-by-step checklist | Follow during deployment |
| **DEPLOYMENT_GUIDE.md** | Complete deployment instructions | Detailed how-to guide |
| **QUICK_START_MOONBEAM.md** | Fast deployment guide | Quick reference |
| **MOONBEAM_DEPLOYMENT.md** | Moonbeam-specific details | Troubleshooting |
| **MOONBEAM_SETUP.md** | Configuration summary | Understanding setup |
| **README.md** | Project overview | General information |

---

## 🎯 What You Need

### For Testnet Deployment (Moonbase Alpha)
- ✅ Private key (from MetaMask or any wallet)
- ✅ DEV tokens (get free from https://faucet.moonbeam.network/)
- ✅ 5 minutes of time

### For Mainnet Deployment (Moonbeam)
- ✅ Private key (hardware wallet recommended)
- ✅ GLMR tokens (buy from exchanges like Binance, Kraken)
- ✅ Tested contracts on Moonbase Alpha first
- ✅ Contract audit (recommended for production)

---

## 🛠️ Essential Commands

### Deployment
```bash
npm run deploy:moonbase    # Deploy to testnet (FREE)
npm run deploy:moonbeam    # Deploy to mainnet (uses GLMR)
```

### Utilities
```bash
npm run balance -- --network moonbaseAlpha  # Check testnet balance
npm run balance -- --network moonbeam       # Check mainnet balance
npm run info -- --network moonbaseAlpha     # Testnet network info
npm run info -- --network moonbeam          # Mainnet network info
```

### Development
```bash
npm test                   # Run all 50 tests
npm run compile            # Compile contracts
npm run clean              # Clean artifacts
```

---

## 🌐 Network Information

### Moonbase Alpha (Testnet)
- **Chain ID**: 1287
- **Token**: DEV (free)
- **Faucet**: https://faucet.moonbeam.network/
- **Explorer**: https://moonbase.moonscan.io/
- **Purpose**: Testing and development

### Moonbeam (Mainnet)
- **Chain ID**: 1284
- **Token**: GLMR (buy on exchanges)
- **Explorer**: https://moonbeam.moonscan.io/
- **Purpose**: Production deployment

---

## ⚡ Deployment Flow

```
1. Edit .env file
   ↓
2. Get tokens (DEV for testnet, GLMR for mainnet)
   ↓
3. Check balance
   ↓
4. Run deployment command
   ↓
5. Save contract addresses
   ↓
6. Verify on Moonscan (optional)
   ↓
7. Test deployed contracts
   ↓
8. Success! ��
```

---

## 📋 Pre-Deployment Checklist

### Before Testnet Deployment
- [ ] `.env` file configured with private key
- [ ] DEV tokens in wallet (from faucet)
- [ ] Contracts compiled (`npm run compile`)
- [ ] Tests passing (`npm test`)

### Before Mainnet Deployment
- [ ] Successfully deployed and tested on Moonbase Alpha
- [ ] GLMR tokens in wallet (5-10 GLMR recommended)
- [ ] Contracts audited (strongly recommended)
- [ ] Hardware wallet ready (recommended)
- [ ] Deployment plan reviewed by team

---

## 🎯 Your Next Step

**Choose one:**

### Option A: Deploy to Testnet (Recommended First)
1. Read: **DEPLOYMENT_GUIDE.md** (Part 1)
2. Follow: **CHECKLIST.md** (Testnet section)
3. Deploy: `npm run deploy:moonbase`

### Option B: Deploy to Mainnet (Production)
1. Complete Option A first ☝️
2. Read: **DEPLOYMENT_GUIDE.md** (Part 2)
3. Follow: **CHECKLIST.md** (Mainnet section)
4. Deploy: `npm run deploy:moonbeam`

---

## 🆘 Need Help?

- **Quick Issues**: See DEPLOYMENT_GUIDE.md → Troubleshooting section
- **Moonbeam Help**: https://discord.gg/moonbeam
- **Documentation**: https://docs.moonbeam.network/

---

## ✅ Success Criteria

You've successfully deployed when you see:

```
✅ Deployment completed successfully!

📋 Contract Addresses:
═══════════════════════════════════════════════
WorkflowRegistry: 0x...
FeeEscrow:        0x...
ActionExecutor:   0x...
═══════════════════════════════════════════════
```

---

## 🚀 Ready to Deploy?

**For Testnet (Start Here):**
```bash
nano .env                    # Add your private key
# Visit https://faucet.moonbeam.network/ to get DEV tokens
npm run deploy:moonbase      # Deploy!
```

**For Mainnet (After Testing):**
```bash
npm run deploy:moonbeam      # Make sure you have GLMR!
```

---

**Good luck with your deployment! ��🚀**

For detailed instructions, see **DEPLOYMENT_GUIDE.md**
