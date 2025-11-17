# Autometa

Autometa is a no-code workflow automation platform for blockchain events and actions. It combines a FastAPI backend, a Next.js frontend, a Python worker/scheduler, and smart contracts (EVM) to schedule and execute automated on-chain actions.

This repository is configured to run on the Moonbeam / Polkadot ecosystem testnet (Moonbase Alpha). Below you'll find a concise overview and the Polkadot-related components and tooling used by the project.

## Key points

- Primary network: Moonbeam (a Polkadot parachain that provides EVM compatibility).
- Testnet used: Moonbase Alpha (Moonbeam's testnet).
- RPC endpoints in the repo are pointed at `https://rpc.api.moonbase.moonbeam.network` by default.
- Explorer links in the frontend point to Moonbase Moonscan (e.g. `https://moonbase.moonscan.io/`).
- Hardhat scripts reference the `moonbaseAlpha` network and tooling for deployment/role-granting.

## Polkadot / Moonbeam ecosystem features used

The project is Ethereum/EVM-native but runs on Moonbeam, which is part of the Polkadot ecosystem. Relevant integrations and references in the codebase:

- Moonbeam / Moonbase Alpha
  - RPC: `https://rpc.api.moonbase.moonbeam.network` (used by backend, worker, and frontend env files)
  - Chain name in frontend: `Moonbase Alpha` (see `frontend/.env.local`)
  - Explorer: Moonscan for Moonbase (transaction and contract links in the UI)
  - Faucet: `https://faucet.moonbeam.network/` (referenced in UI footer)

- Contracts & Hardhat
  - Hardhat deployment scripts and helper scripts reference `moonbaseAlpha` in `scripts/` and other tooling (grant-worker-role, deploy, etc.).
  - Typical flow: compile with Hardhat and deploy to the Moonbase Alpha testnet when contract changes are required.

- Token mapping & adapters
  - Price/adapter code includes mappings for `dot` → `polkadot` and `glmr` → `moonbeam`, indicating the UI/backend recognize Polkadot-related assets.

- EVM compatibility & Web3 provider
  - The backend/worker use web3.py (and EVM-compatible tooling) with POA middleware injected for Moonbeam compatibility.
  - The worker's executor uses EIP-1559 fields adapted for Moonbeam.

## Project layout (top-level)

- `backend/` — FastAPI service providing REST APIs, contract helpers, and the `escrow` endpoints.
- `worker/` — Python scheduler + worker, Redis-backed queue, executors for running on-chain actions.
- `contracts/` — Solidity contracts, Hardhat config, deployment scripts. (Deployed to Moonbase Alpha in the original setup.)
- `frontend/` — Next.js app showing dashboards, transaction links, and wallet interactions.
- `tools/` — Small scripts for local tasks (manual execute, get worker address, etc.).

## Environment & important variables

Examples are present in `backend/.env`, `worker/.env`, and `frontend/.env.local`:

- `MOONBASE_RPC` — RPC endpoint for Moonbase Alpha
- `RPC_URL` — used by backend for log/event queries (defaults to Moonbase RPC)
- `NEXT_PUBLIC_RPC_URL` — frontend RPC for wallet/network/local links
- Contract addresses (stored in frontend env and `worker`/`backend` configs when deployed)

Make sure these point to the intended network (Moonbase Alpha) if you want to run against the Polkadot ecosystem testnet.

## How to run (quick)

1. Backend

- Create a Python venv and install requirements from `backend/requirements.txt`.
- Set `MOONBASE_RPC` and other env variables in `backend/.env`.
- Start FastAPI server (example):

```bash
cd backend
# activate venv
python -m uvicorn src.main:app --reload --port 8000
```

2. Worker & Scheduler

- Create a Python venv and install `worker/requirements.txt`.
- Configure `worker/.env` (ensure `MOONBASE_RPC`, `BACKEND_API_URL`, Redis URL, private keys, etc.).
- Start scheduler and worker (examples):

```bash
cd worker
# activate venv
nohup python -m src.main scheduler >> scheduler.log 2>&1 &
nohup python -m src.main worker >> worker.log 2>&1 &
```

3. Frontend

- `cd frontend` and install node deps
- Add `frontend/.env.local` values (RPC and contract addresses)
- Start Next.js dev server: `npm run dev`

## Notes & caveats

- Although running on Moonbeam (an ecosystem project inside Polkadot), this code is EVM-oriented — contracts are Solidity and interactions use web3/ethers-style patterns.
- The current setup uses Moonbase Alpha testnet for development and tests.
- Some behavior (for example gas charging on failed contract calls) may require contract redeploys to change; the worker fixes can mitigate operational issues without redeploying contracts.

## Useful links

- Moonbeam docs: https://docs.moonbeam.network/
- Moonbase Alpha info: https://docs.moonbeam.network/networks/testnet/
- Moonscan (Moonbase explorer): https://moonbase.moonscan.io/
- Moonbeam faucet: https://faucet.moonbeam.network/

---

If you'd like, I can:
- Add a short `How we use Polkadot/Moonbeam` section showing exact files that reference `MOONBASE_RPC` and explorer links.
- Add quick commands to deploy contracts to `moonbaseAlpha` using Hardhat (if/when you decide to redeploy).

