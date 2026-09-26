# Project Progress

## Current state

The repository contains the project scaffold, MVP `GrantEscrow` core contract/test suite, and a local-data React/Vite frontend demo. Production deployment and live wallet integration remain unimplemented.

## Completed steps

1. Reconnaissance: confirmed the initial repository contained only `.gitkeep`.
2. Step 2 foundation: created workspace configuration, Hardhat contract structure, React/Vite frontend structure, environment template, documentation, and ignore rules.
3. Step 3 contract core: implemented the `CREATED -> FUNDED -> RELEASED` grant lifecycle, explicit swap adapter boundary, mock contracts, and Hardhat tests for access control, deadlines, raw payouts, multiplier invariance, immutability, and payout reentrancy.
4. Step 4 frontend MVP: built landing, employer funding/grants, and contractor grant views using a certificate-led visual system and an isolated local demo adapter.

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
- Provides `/`, `/employer/fund`, `/employer/grants`, and `/contractor/grant` with explicit demo/testnet messaging; no wallet or blockchain connection is implemented.

## Remaining work

- Confirm and incorporate the design/build specifications once available in the project context.
- Review the contract and mock adapter design against the final Design and Build Specs, then perform a security-focused audit before a live deployment.
- Add deployment scripts only after official network, token, and adapter values are available.
- Connect the existing frontend adapter to reviewed viem/wagmi contract reads and writes only after official addresses and wallet UX are approved.
- Add any approved USDG/stock-token swap integration only after its requirements and addresses are confirmed.

## Next recommended implementation step

Validate the frontend against the approved Design Spec once the full source is available, then replace only the adapter implementation with reviewed viem/wagmi integration after official addresses and wallet UX are approved. Do not deploy or connect a wallet until those values are supplied.
