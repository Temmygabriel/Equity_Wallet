# Equity Benefit Wallet — Durable Context

## Product

Equity Benefit Wallet is a hackathon MVP for helping employers issue and manage equity-related benefits for contractors through a wallet-oriented experience.

## Core concept

The product represents a contractor benefit grant, with an employer-side issuance path and a contractor-side benefit wallet. The MVP contract now implements the escrow lifecycle `CREATED -> FUNDED -> RELEASED`; there is no cancellation state.

## Target network

- Robinhood Chain testnet
- Chain ID: `46630`
- Public RPC: `https://rpc.testnet.chain.robinhood.com` (override with `RH_RPC_URL` only when necessary).
- Explorer: `https://explorer.testnet.chain.robinhood.com`.

## Architectural constraints

- Keep the MVP small, understandable, and based on free/open-source tooling.
- Use Solidity/Hardhat for contracts and React/TypeScript/Vite for the frontend.
- Keep contracts, tests, deployment scripts, frontend, and shared documentation in separate top-level areas.
- Do not hard-code unknown RPC URLs, addresses, token metadata, router addresses, or deployment values.
- Deployment requires environment-supplied `USDG`, `SWAP_ADAPTER`, `AAPL`, `TSLA`, and `NVDA` addresses; current values remain placeholders until official testnet addresses are verified.

## Security constraints

- Never commit private keys, RPC credentials, or other secrets; use `.env` locally and retain `.env.example` as a key-only template.
- Contract security review and comprehensive tests must precede any real deployment.
- Do not expose or imply that a placeholder frontend is a usable wallet or custody solution.

## Implemented contract architecture and invariants

- `GrantEscrow` accepts constructor-supplied USDG, trusted swap-adapter, AAPL, TSLA, and NVDA addresses. This is temporary testnet wiring; these values must be verified and replaced only from official deployment inputs.
- `createGrant` records the caller as employer. Only that employer can fund or release; only the stored contractor can claim at/after the deadline.
- Funding accepts USDG, permits only the three constructor-supplied stock tokens, calls the explicit `ISwapAdapter`, clears the adapter allowance afterward, and records the received raw stock-token balance delta.
- The selected token and deadline are fixed once funding succeeds because no mutation functions exist and grants can only be funded from `CREATED`.
- A stock token's `uiMultiplier()` is read exactly once at funding and retained for display/audit context only. Release and timeout claim transfer the stored `rawEscrowAmount` exactly and never recalculate a payout from a multiplier.
- Both payout paths are non-reentrant, transition to `RELEASED` before the token transfer, and always pay the stored contractor.
- Focused static review in Step 5 found no objective issue requiring a contract change: state transitions, access checks, exact raw payout, allowance reset, and payout reentrancy protection match the current MVP requirements.
- The trusted swap adapter remains the only swap boundary. 0x supports Robinhood Chain mainnet (`4663`) but not testnet (`46630`), so no 0x testnet route is configured.

## UI/design constraints

- The frontend has four Vite routes: landing, employer funding, employer grants, and contractor grant.
- The visual system uses Fraunces and Inter with paper, ink, and brass colors; square bordered surfaces; 3px button corners; no gradients, shadows, or generic SaaS-card treatment.
- The certificate component must retain the `cert → cert-inner → cert-core` composition, a wax-seal state badge, left-aligned landing hero copy, a centered certificate, visible focus states, and reduced-motion support.
- Certificate states are `LOCKED`, `UNLOCKED`, and `CLAIMED`; green is reserved for the unlocked badge.
- The frontend uses viem through `chainAdapter.ts` for EIP-1193 wallet connection and real testnet reads/writes. It is configured only from deployment-produced `VITE_*` addresses and must display that mock assets are not real securities.
- Tokens follow the Design Spec's cool values (`--paper #FAFAF7`, `--ink #16233D`, `--brass #8A6A34`), not warm cream. Type uses only Fraunces 400/500 and Inter 400/500. Letter-spaced all-caps eyebrow labels and middle-dot meta strings are prohibited by the Design Spec and must not be reintroduced.
- Certificate seal sits on the certificate's outer edge (`−14px` offsets, `−8deg`) and renders **only** when the grant is no longer held; a held grant shows a quiet "Held until [date]" line instead. The certificate carries a generated guilloché underprint as its security-print motif.
- The `UNLOCKED` certificate state is not reachable from chain data: `GrantEscrow.Status` is `CREATED | FUNDED | RELEASED`, so `chainAdapter` maps `1 → LOCKED` and `2 → CLAIMED`. `UNLOCKED` currently appears only on the landing specimen certificate.
- **The milestone description is not stored on-chain.** The `Grant` struct has no milestone field and `fundGrant` does not accept one. The frontend keeps the description in browser `localStorage` against the grant reference and labels it honestly where it is unavailable. Adding an on-chain milestone field would be a contract change and needs explicit approval.
- `DemoGrant` exposes `deadlineTimestamp` (unix seconds) so the UI can tell whether the timeout claim is available. `releaseGrant` is employer-only and pre-deadline; `claimAfterTimeout` is contractor-only and at/after the deadline, so exactly one action is ever valid.

## Explicitly out of scope for this scaffold

- USDG-to-stock-token swapping and 0x integration
- Wallet connection, signing, or transaction flows
- Mainnet deployment or use of real securities/token addresses
- AI/LLM features and paid services

## Current toolchain

npm workspaces; Hardhat, Solidity `0.8.24`, and TypeScript for contracts; React, TypeScript, and Vite for the frontend.

## Testnet mock demo

- `deploy:demo:testnet` checks chain ID `46630`, deploys MockUSDG, mock AAPL/TSLA/NVDA, MockSwapAdapter, and GrantEscrow, and mints initial mock USDG to the deployer.
- The mock adapter is deterministic: its default rate is 1:1 at 18 decimals and it enforces `minStockOut`. The existing fixed-output mode is retained solely for unit tests.
- The demo contract addresses are never committed; copy the script output into `frontend/.env.local` after deployment.
