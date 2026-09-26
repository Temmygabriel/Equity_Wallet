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

The Robinhood testnet network is added to Hardhat only when `ROBINHOOD_TESTNET_RPC_URL` is set. No RPC endpoint, token, router, or contract address is assumed by this repository.

## Scope of this scaffold

This commit establishes structure and configuration only. It intentionally includes no escrow/grant logic, swap integration, deployment to a live network, wallet connection flow, or product pages.
