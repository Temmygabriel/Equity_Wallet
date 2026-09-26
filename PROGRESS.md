# Project Progress

## Current state

The repository contains the project scaffold plus the MVP `GrantEscrow` core contract and its Hardhat test suite. Production deployment and product UI remain unimplemented.

## Completed steps

1. Reconnaissance: confirmed the initial repository contained only `.gitkeep`.
2. Step 2 foundation: created workspace configuration, Hardhat contract structure, React/Vite frontend structure, environment template, documentation, and ignore rules.
3. Step 3 contract core: implemented the `CREATED -> FUNDED -> RELEASED` grant lifecycle, explicit swap adapter boundary, mock contracts, and Hardhat tests for access control, deadlines, raw payouts, multiplier invariance, immutability, and payout reentrancy.

## Git baseline

- Current branch: `work`
- Starting commit before Step 2: `1e99c8c` (`Initialize repository`)

## Implemented contract behavior

- Configures npm workspaces for `contracts` and `frontend`.
- Configures Solidity `0.8.24` with Hardhat.
- Defines the optional `robinhoodTestnet` Hardhat network with chain ID `46630`, activated only when a local RPC environment variable is supplied.
- Stores employer, contractor, selected token, raw escrow amount, multiplier snapshot, deadline, and status per grant.
- Uses constructor-supplied temporary addresses for USDG, swap adapter, AAPL, TSLA, and NVDA; no real network values are included.
- Limits funding/release to the employer and timeout claim to the stored contractor, with `releaseGrant` requiring a pre-deadline timestamp and `claimAfterTimeout` allowing the exact deadline.
- Stores the stock-token balance delta and transfers that same stored raw amount on either payout path, independent of future multiplier changes.

## Remaining work

- Confirm and incorporate the design/build specifications once available in the project context.
- Review the contract and mock adapter design against the final Design and Build Specs, then perform a security-focused audit before a live deployment.
- Add deployment scripts only after official network, token, and adapter values are available.
- Build employer and contractor frontend experiences, wallet flows, and any certificate experience.
- Add any approved USDG/stock-token swap integration only after its requirements and addresses are confirmed.

## Next recommended implementation step

Review the implemented `GrantEscrow` interface and test suite against the approved Design and Build Specs, then write a deployment runbook that consumes verified official testnet values. Do not deploy or select token/router addresses until those values are supplied.
