# Project Progress

## Current state

The repository contains the project scaffold, MVP `GrantEscrow` core contract/test suite, local-data React/Vite frontend demo, testnet deployment script, and CI workflow. The contract has not been deployed.

## Completed steps

1. Reconnaissance: confirmed the initial repository contained only `.gitkeep`.
2. Step 2 foundation: created workspace configuration, Hardhat contract structure, React/Vite frontend structure, environment template, documentation, and ignore rules.
3. Step 3 contract core: implemented the `CREATED -> FUNDED -> RELEASED` grant lifecycle, explicit swap adapter boundary, mock contracts, and Hardhat tests for access control, deadlines, raw payouts, multiplier invariance, immutability, and payout reentrancy.
4. Step 4 frontend MVP: built landing, employer funding/grants, and contractor grant views using a certificate-led visual system and an isolated local demo adapter.
5. Step 5 deployment/CI: configured the verified Robinhood Chain testnet RPC, added environment-validated deployment tooling, documented the explorer runbook, and added GitHub Actions validation.

## Git baseline

- Current branch: `work`
- Starting commit before Step 2: `1e99c8c` (`Initialize repository`)

## Implemented contract behavior

- Configures npm workspaces for `contracts` and `frontend`.
- Configures Solidity `0.8.24` with Hardhat.
- Defines the `robinhoodTestnet` Hardhat network with chain ID `46630` and the verified public RPC default.
- Stores employer, contractor, selected token, raw escrow amount, multiplier snapshot, deadline, and status per grant.
- Uses constructor-supplied temporary addresses for USDG, swap adapter, AAPL, TSLA, and NVDA; no real network values are included.
- Limits funding/release to the employer and timeout claim to the stored contractor, with `releaseGrant` requiring a pre-deadline timestamp and `claimAfterTimeout` allowing the exact deadline.
- Stores the stock-token balance delta and transfers that same stored raw amount on either payout path, independent of future multiplier changes.
- Provides `/`, `/employer/fund`, `/employer/grants`, and `/contractor/grant` with explicit demo/testnet messaging; no wallet or blockchain connection is implemented.
- Configures `robinhoodTestnet` at chain ID `46630` using `RH_RPC_URL`, with the verified public RPC as the default and an optional private key.
- Adds `deploy:testnet`, which requires non-zero `USDG`, `SWAP_ADAPTER`, `AAPL`, `TSLA`, and `NVDA` environment values before deployment.
- Adds CI for dependency installation, contract compilation/tests, frontend typecheck, and frontend build. No CI secrets are required.

## Deployment record

- GrantEscrow testnet address: not deployed; record only after a verified explorer deployment.
- 0x route: not configured. 0x supports Robinhood Chain mainnet `4663`, not testnet `46630`.

## Remaining work

- Confirm and incorporate the design/build specifications once available in the project context.
- Review the contract and mock adapter design against the final Design and Build Specs, then perform a security-focused audit before a live deployment.
- Supply and independently verify official testnet USDG, adapter, and stock-token addresses before any deployment.
- Connect the existing frontend adapter to reviewed viem/wagmi contract reads and writes only after official addresses and wallet UX are approved.
- Add any approved USDG/stock-token swap integration only after its requirements and addresses are confirmed.

## Next recommended implementation step

Obtain and independently verify official testnet USDG, adapter, and stock-token addresses, fund a dedicated testnet deployer with testnet ETH, then deploy with the runbook and record the verified explorer address. Do not add a 0x testnet route or connect a wallet until the required support and UX are approved.
