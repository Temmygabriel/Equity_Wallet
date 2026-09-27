# Equity Benefit Wallet

A hackathon MVP for a benefit wallet that helps employers issue and manage equity-related benefits for contractors. It includes the GrantEscrow contract, a viem-connected Robinhood Chain Testnet mock demo, deployment scripts, and CI validation.

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

Open the local URL reported by Vite. The demo includes `/`, `/employer/fund`, `/employer/grants`, and `/contractor/grant`. After deploying the supported mock contracts and configuring `frontend/.env.local`, it connects an EIP-1193 wallet, reads the configured testnet contracts, and submits testnet transactions. It does not support real securities, production custody, or mainnet use.

## Testnet deployment

Robinhood Chain testnet uses chain ID `46630`, public RPC `https://rpc.testnet.chain.robinhood.com`, and explorer `https://explorer.testnet.chain.robinhood.com`.

1. Fund the local deployer wallet with Robinhood Chain **testnet ETH**.
2. Copy `.env.example` to `.env`. `RH_RPC_URL` defaults to the verified public testnet RPC; set `DEPLOYER_PRIVATE_KEY` locally and never commit it.
3. Fill `USDG`, `SWAP_ADAPTER`, `AAPL`, `TSLA`, and `NVDA` only with verified official testnet addresses. The deployment script rejects missing, malformed, and zero addresses.
4. Run `npm run deploy:testnet --workspace contracts`.
5. Verify the deployed contract on the [Robinhood Chain testnet explorer](https://explorer.testnet.chain.robinhood.com), then record the verified address in `PROGRESS.md`.

The swap adapter remains an explicit contract boundary. 0x Swap API support is currently available for Robinhood Chain mainnet (`4663`), **not** testnet (`46630`); this repository does not claim or attempt a testnet 0x route.

## End-to-end mock demo

This is the supported Robinhood Chain **testnet** demonstration. It deploys mock USDG and mock AAPL/TSLA/NVDA contracts; these assets are not real securities.

1. Set `DEPLOYER_PRIVATE_KEY` in root `.env` and fund that account with Robinhood Chain testnet ETH.
2. Run `npm run deploy:demo:testnet --workspace contracts`. The script deploys MockUSDG, mock stock tokens, MockSwapAdapter, and GrantEscrow, then prints `VITE_*` values and chain ID `46630`.
3. Copy the printed `VITE_*` values into `frontend/.env.local`; do not make up addresses.
4. Run `npm run dev --workspace frontend`, connect an EIP-1193 wallet on Robinhood Chain Testnet (`46630`), and open `/employer/fund`.
5. As the employer, enter a contractor address, future deadline, test stock, and USDG amount, then sign create/approve/fund transactions. The deployer receives initial mock USDG.
6. Open `/contractor/grant`, load the returned Grant ID, then have the employer use **Release now** before the deadline or the stored contractor use **Claim it yourself** at/after the deadline.

The mock adapter converts USDG to the selected mock stock deterministically at a 1:1 18-decimal rate unless changed for a test. It enforces `minStockOut`; no 0x route is involved.

## Scope of this scaffold

The frontend supports only the configured Robinhood Chain testnet mock contracts through an EIP-1193 wallet. It intentionally includes no production swap integration, mainnet deployment, real securities/token addresses, backend, or authentication.
