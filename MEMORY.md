# Equity Benefit Wallet — Durable Context

## Product

Equity Benefit Wallet is a hackathon MVP for helping employers issue and manage equity-related benefits for contractors through a wallet-oriented experience.

## Core concept

The intended product will represent a contractor benefit grant, with an employer-side issuance path and a contractor-side benefit wallet. This repository currently contains only the project foundation; no grant or escrow behavior exists.

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

## UI/design constraints

- Future UI should clearly distinguish employer and contractor experiences.
- Future benefit state, balances, eligibility, and any transaction status must be explicit and understandable.
- No employer/contractor pages, wallet flow, or certificate UI are included in this scaffold.

## Explicitly out of scope for this scaffold

- `GrantEscrow` logic and grant state transitions
- USDG-to-stock-token swapping and 0x integration
- Wallet connection, signing, or transaction flows
- Real contract deployment
- Employer/contractor product pages and certificate UI
- AI/LLM features and paid services

## Current toolchain

npm workspaces; Hardhat, Solidity `0.8.24`, and TypeScript for contracts; React, TypeScript, and Vite for the frontend.
