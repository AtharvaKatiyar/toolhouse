# Autometa Smart Contracts

Smart contracts for the Autometa workflow automation platform on Moonbeam.

## Overview

This repository contains three main smart contracts designed for deployment on Moonbeam (Polkadot parachain):

- **WorkflowRegistry**: Stores user automation workflows with minimal on-chain storage
- **FeeEscrow**: Manages gas deposits and charges for workflow execution
- **ActionExecutor**: Executes workflow actions on behalf of users

## Moonbeam Networks

The contracts are configured for deployment on:
- **Moonbeam** - Production parachain on Polkadot (ChainID: 1284)
- **Moonriver** - Production parachain on Kusama (ChainID: 1285)
- **Moonbase Alpha** - Testnet (ChainID: 1287)

## Prerequisites

- Node.js >= 16.x
- npm or yarn

## Installation

```bash
npm install
```

## Configuration

1. Copy the environment example file:
```bash
cp .env.example .env
```

2. Edit `.env` and add your configuration:
   - `PRIVATE_KEY`: Your deployer wallet private key
   - `MOONBASE_RPC_URL`: RPC endpoint for Moonbase Alpha testnet (default provided)
   - `MOONRIVER_RPC_URL`: RPC endpoint for Moonriver (default provided)
   - `MOONBEAM_RPC_URL`: RPC endpoint for Moonbeam mainnet (default provided)
   - `MOONSCAN_API_KEY`: API key for contract verification on Moonscan

## Compilation

Compile the smart contracts:

```bash
npm run compile
```

## Testing

Run the complete test suite:

```bash
npm test
```

Run tests with gas reporting:

```bash
REPORT_GAS=true npm test
```

Run test coverage:

```bash
npm run test:coverage
```

## Deployment

### Local Development

1. Start a local Hardhat node:
```bash
npm run node
```

2. In a new terminal, deploy to localhost:
```bash
npm run deploy:local
```

### Moonbase Alpha Testnet (Recommended for Testing)

Get testnet tokens from the [Moonbeam Faucet](https://faucet.moonbeam.network/) first, then deploy:

```bash
npm run deploy:moonbase
# or
npm run deploy:testnet
```

### Moonriver Deployment

Deploy to Moonriver (Kusama parachain):

```bash
npm run deploy:moonriver
```

### Moonbeam Mainnet Deployment

Deploy to Moonbeam (Polkadot parachain):

```bash
npm run deploy:moonbeam
```

### Contract Verification

After deployment, verify contracts on Moonscan:

```bash
# Moonbeam
npm run verify:moonbeam -- <CONTRACT_ADDRESS> <CONSTRUCTOR_ARGS>

# Moonriver
npm run verify:moonriver -- <CONTRACT_ADDRESS> <CONSTRUCTOR_ARGS>

# Moonbase Alpha
npm run verify:moonbase -- <CONTRACT_ADDRESS> <CONSTRUCTOR_ARGS>
```

## Contract Architecture

### WorkflowRegistry

Manages workflow creation, updates, and lifecycle:
- Create workflows with trigger and action parameters
- Update, pause, resume, and delete workflows
- Query workflows by owner
- Admin functions for emergency control

### FeeEscrow

Handles gas fee management:
- Users deposit native tokens for gas
- Workers charge gas from user balances
- Users can withdraw unused gas
- Emergency withdrawal for admins

### ActionExecutor

Executes workflow actions:
- Native token transfers
- ERC20 token transfers
- Generic contract calls
- Integrated with FeeEscrow for gas charging
- Updates workflow state after execution

## Deployment Addresses

After deployment, contract addresses are saved in `deployments/` directory.

## Security

- All contracts use OpenZeppelin's AccessControl for role management
- ReentrancyGuard protection on critical functions
- Comprehensive test coverage

## License

MIT

## Contributing

Please ensure all tests pass before submitting pull requests:

```bash
npm test
```
