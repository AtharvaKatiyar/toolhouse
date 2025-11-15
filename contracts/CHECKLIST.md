# ✅ Deployment Checklist

Use this checklist to deploy your contracts step by step.

---

## 🧪 TESTNET DEPLOYMENT (Moonbase Alpha) - START HERE

### Pre-Deployment
- [ ] Navigate to contracts directory: `cd /home/mime/Desktop/autometa/contracts`
- [ ] Dependencies installed: `npm install` (already done ✓)
- [ ] Edit `.env` file with your private key
- [ ] Get DEV tokens from https://faucet.moonbeam.network/
- [ ] Check balance: `npm run balance -- --network moonbaseAlpha`

### Compilation & Testing
- [ ] Compile contracts: `npm run compile`
- [ ] Run tests: `npm test` (should show 50 passing)
- [ ] Review network info: `npm run info -- --network moonbaseAlpha`

### Deployment
- [ ] Deploy to Moonbase Alpha: `npm run deploy:moonbase`
- [ ] Save contract addresses from terminal output
- [ ] Check deployment file: `ls deployments/`
- [ ] Verify contracts (optional): See DEPLOYMENT_GUIDE.md

### Post-Deployment Testing
- [ ] View contracts on Moonbase Moonscan: https://moonbase.moonscan.io/
- [ ] Test workflow creation
- [ ] Test gas deposit to FeeEscrow
- [ ] Test workflow execution

---

## 🌐 MAINNET DEPLOYMENT (Moonbeam) - ONLY WHEN READY

### Pre-Deployment
- [ ] Successfully tested on Moonbase Alpha
- [ ] Contracts audited (recommended)
- [ ] Get GLMR tokens (buy from exchange)
- [ ] Transfer GLMR to deployment wallet (min 5-10 GLMR)
- [ ] Check balance: `npm run balance -- --network moonbeam`
- [ ] Hardware wallet connected (recommended for mainnet)

### Final Checks
- [ ] Team review completed
- [ ] Deployment plan documented
- [ ] Emergency procedures in place
- [ ] Monitoring tools ready

### Deployment
- [ ] Review network: `npm run info -- --network moonbeam`
- [ ] Deploy to Moonbeam: `npm run deploy:moonbeam` ⚠️ USES REAL GLMR
- [ ] Save contract addresses
- [ ] Backup deployment info
- [ ] Verify contracts: See DEPLOYMENT_GUIDE.md

### Post-Deployment
- [ ] Verify on Moonbeam Moonscan: https://moonbeam.moonscan.io/
- [ ] Set up monitoring/alerts
- [ ] Test small transaction first
- [ ] Document deployment for team
- [ ] Announce deployment (if public)

---

## 📝 Notes & Addresses

### Moonbase Alpha (Testnet) Deployment
```
Date: _______________
Deployer: _______________

WorkflowRegistry: _______________
FeeEscrow:        _______________
ActionExecutor:   _______________

Moonscan Link: https://moonbase.moonscan.io/address/_______________
```

### Moonbeam (Mainnet) Deployment
```
Date: _______________
Deployer: _______________

WorkflowRegistry: _______________
FeeEscrow:        _______________
ActionExecutor:   _______________

Moonscan Link: https://moonbeam.moonscan.io/address/_______________
```

---

## 🆘 Quick Commands Reference

```bash
# Check balance
npm run balance -- --network moonbaseAlpha
npm run balance -- --network moonbeam

# Network info
npm run info -- --network moonbaseAlpha
npm run info -- --network moonbeam

# Deploy
npm run deploy:moonbase    # Testnet
npm run deploy:moonbeam    # Mainnet

# Verify
npm run verify:moonbase -- <ADDRESS> <ARGS>
npm run verify:moonbeam -- <ADDRESS> <ARGS>
```

---

**Current Status**: Ready to deploy to Moonbase Alpha testnet ✓

**Next Step**: Edit `.env` with your private key and get DEV tokens!
