# Moonbeam Deployment Guide

This guide covers deploying Autometa smart contracts on Moonbeam networks.

## Network Information

### Moonbase Alpha (Testnet)
- **Chain ID**: 1287
- **RPC URL**: https://rpc.api.moonbase.moonbeam.network
- **Block Explorer**: https://moonbase.moonscan.io
- **Faucet**: https://faucet.moonbeam.network/
- **Gas Token**: DEV

### Moonriver (Kusama)
- **Chain ID**: 1285
- **RPC URL**: https://rpc.api.moonriver.moonbeam.network
- **Block Explorer**: https://moonriver.moonscan.io
- **Gas Token**: MOVR

### Moonbeam (Polkadot)
- **Chain ID**: 1284
- **RPC URL**: https://rpc.api.moonbeam.network
- **Block Explorer**: https://moonbeam.moonscan.io
- **Gas Token**: GLMR

## Prerequisites

1. **MetaMask Setup**: Add Moonbeam networks to MetaMask
   - Visit [Moonbeam Docs](https://docs.moonbeam.network/builders/get-started/networks/moonbeam/)
   - Or use https://chainlist.org/

2. **Get Testnet Tokens**: 
   - Visit [Moonbeam Faucet](https://faucet.moonbeam.network/)
   - Connect your wallet and request DEV tokens

3. **Get Moonscan API Key** (for verification):
   - Visit https://moonscan.io/apis
   - Register and get your API key

## Step-by-Step Deployment

### 1. Configure Environment

```bash
cp .env.example .env
```

Edit `.env`:
```bash
PRIVATE_KEY=your_private_key_without_0x_prefix
MOONBASE_RPC_URL=https://rpc.api.moonbase.moonbeam.network
MOONRIVER_RPC_URL=https://rpc.api.moonriver.moonbeam.network
MOONBEAM_RPC_URL=https://rpc.api.moonbeam.network
MOONSCAN_API_KEY=your_moonscan_api_key
```

### 2. Test Locally First

```bash
# Compile contracts
npm run compile

# Run tests
npm test

# Check for errors
npm run clean && npm run compile
```

### 3. Deploy to Moonbase Alpha (Testnet)

```bash
npm run deploy:moonbase
```

Example output:
```
Starting deployment...
Deploying contracts with account: 0x1234...
Account balance: 100 DEV

1. Deploying WorkflowRegistry...
WorkflowRegistry deployed to: 0xabcd...

2. Deploying FeeEscrow...
FeeEscrow deployed to: 0xef01...

3. Deploying ActionExecutor...
ActionExecutor deployed to: 0x2345...

4. Configuring roles...
✅ Deployment completed successfully!
```

### 4. Verify Contracts on Moonscan

```bash
# Verify WorkflowRegistry
npx hardhat verify --network moonbaseAlpha <REGISTRY_ADDRESS> "<ADMIN_ADDRESS>"

# Verify FeeEscrow
npx hardhat verify --network moonbaseAlpha <ESCROW_ADDRESS> "<ADMIN_ADDRESS>"

# Verify ActionExecutor
npx hardhat verify --network moonbaseAlpha <EXECUTOR_ADDRESS> "<ADMIN_ADDRESS>" "<REGISTRY_ADDRESS>" "<ESCROW_ADDRESS>"
```

### 5. Deploy to Production (Moonbeam/Moonriver)

**For Moonriver:**
```bash
npm run deploy:moonriver
```

**For Moonbeam:**
```bash
npm run deploy:moonbeam
```

## Gas Optimization Tips

1. **Moonbase Alpha**: Gas is free, no optimization needed
2. **Moonriver**: Use lower gas prices (1-5 gwei typically sufficient)
3. **Moonbeam**: Check current gas prices on Moonscan

## Post-Deployment Checklist

- [ ] Verify all contracts on Moonscan
- [ ] Test workflow creation from frontend
- [ ] Fund FeeEscrow with gas tokens
- [ ] Grant WORKER_ROLE to off-chain worker
- [ ] Test full workflow execution
- [ ] Monitor gas costs
- [ ] Set up monitoring/alerts

## Common Issues

### "Insufficient funds for gas"
- Check your account balance: `npx hardhat run scripts/check-balance.js --network moonbaseAlpha`
- Get more DEV tokens from faucet

### "Invalid nonce"
- Clear pending transactions in MetaMask
- Or use: `npx hardhat clean`

### "Contract verification failed"
- Ensure Moonscan API key is correct
- Check constructor arguments match deployment
- Wait a few blocks after deployment

## Moonbeam-Specific Features

### Precompiled Contracts
Moonbeam provides Ethereum-compatible precompiles:
- Batch transactions
- Proxy calls
- XCM integration

### Cross-Chain Integration (XCM)
For cross-chain workflows, you can integrate:
- Polkadot relay chain
- Other parachains
- Kusama network (via Moonriver)

## Resources

- [Moonbeam Documentation](https://docs.moonbeam.network/)
- [Moonbeam Discord](https://discord.gg/moonbeam)
- [Moonscan Explorer](https://moonscan.io/)
- [Hardhat Moonbeam Plugin](https://www.npmjs.com/package/@moonbeam-network/api-augment)

## Security Considerations

1. **Never commit `.env` file**
2. **Use hardware wallet for mainnet deployments**
3. **Audit contracts before production deployment**
4. **Start with small amounts for testing**
5. **Monitor contract activity regularly**

## Support

For issues specific to Moonbeam deployment:
- GitHub Issues: [Open an issue](https://github.com/your-repo/issues)
- Moonbeam Discord: #developers channel
- Documentation: [Moonbeam Docs](https://docs.moonbeam.network/)
