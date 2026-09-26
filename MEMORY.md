# Equity Benefit Wallet — Durable Context

## Product

Equity Benefit Wallet is a hackathon MVP for helping employers issue and manage equity-related benefits for contractors through a wallet-oriented experience.

## Core concept

The product represents a contractor benefit grant, with an employer-side issuance path and a contractor-side benefit wallet. The MVP contract now implements the escrow lifecycle `CREATED -> FUNDED -> RELEASED`; there is no cancellation state.

## Target network

- Robinhood Chain testnet
- Chain ID: `46630`
- RPC endpoint: intentionally not stored in source control; supply it through `ROBINHOOD_TESTNET_RPC_URL` when it is officially available.

## Architectural constraints

- Keep the MVP small, understandable, and based on free/open-source tooling.
- Use Solidity/Hardhat for contracts and React/TypeScript/Vite for the frontend.
- Keep contracts, tests, deployment scripts, frontend, and shared documentation in separate top-level areas.
- Do not hard-code unknown RPC URLs, addresses, token metadata, router addresses, or deployment values.

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

## UI/design constraints

- Future UI should clearly distinguish employer and contractor experiences.
- Future benefit state, balances, eligibility, and any transaction status must be explicit and understandable.
- No employer/contractor pages, wallet flow, or certificate UI are included in this scaffold.

## Explicitly out of scope for this scaffold

- USDG-to-stock-token swapping and 0x integration
- Wallet connection, signing, or transaction flows
- Real contract deployment
- Employer/contractor product pages and certificate UI
- AI/LLM features and paid services

## Current toolchain

npm workspaces; Hardhat, Solidity `0.8.24`, and TypeScript for contracts; React, TypeScript, and Vite for the frontend.
