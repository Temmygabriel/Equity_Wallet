# Equity Benefit Wallet

A hackathon MVP foundation for a benefit wallet that will help employers issue and manage equity-related benefits for contractors. The product implementation has not started in this scaffold.

## Toolchain

- **Smart contracts:** Solidity with Hardhat and TypeScript
- **Frontend:** React, TypeScript, and Vite
- **Target network:** Robinhood Chain testnet (chain ID `46630`)
- **Package manager:** npm workspaces

## Repository layout

```text
contracts/       Solidity sources, Hardhat tests, and deployment scripts
frontend/        Vite + React application
docs/            Shared product and technical documentation
MEMORY.md        Durable project context and constraints
PROGRESS.md      Project handoff and implementation status
```

## Setup

1. Copy `.env.example` to `.env` and provide only the values needed for local deployment work.
2. Install workspace dependencies with `npm install`.
3. Run the available checks:

   ```bash
   npm run typecheck
   npm run compile
   npm test
   npm run build
   ```

## Run the frontend demo

After installing dependencies, start the Vite application from the repository root:

```bash
npm run dev --workspace frontend
```

Open the local URL reported by Vite. The demo includes `/`, `/employer/fund`, `/employer/grants`, and `/contractor/grant`. All information and actions are local demo/testnet UI states: it does not connect a wallet, read live chain data, or submit transactions.

The Robinhood testnet network is added to Hardhat only when `ROBINHOOD_TESTNET_RPC_URL` is set. No RPC endpoint, token, router, or contract address is assumed by this repository.

## Scope of this scaffold

The frontend is a visual MVP built with local fixture data. It intentionally includes no wallet connection, contract read/write integration, production swap integration, deployment to a live network, backend, or authentication.
