# Project Progress

## Current state

The repository contains the project scaffold, MVP `GrantEscrow` core contract/test suite, viem-connected Robinhood Chain testnet mock demo, deployment scripts, and CI workflow. No testnet deployment address is committed. CI's single contract-test failure has been repaired and the frontend art direction is being reworked, both on `feat/editorial-redesign`.

## Completed steps

1. Reconnaissance: confirmed the initial repository contained only `.gitkeep`.
2. Step 2 foundation: created workspace configuration, Hardhat contract structure, React/Vite frontend structure, environment template, documentation, and ignore rules.
3. Step 3 contract core: implemented the `CREATED -> FUNDED -> RELEASED` grant lifecycle, explicit swap adapter boundary, mock contracts, and Hardhat tests for access control, deadlines, raw payouts, multiplier invariance, immutability, and payout reentrancy.
4. Step 4 frontend MVP: built landing, employer funding/grants, and contractor grant views using a certificate-led visual system and an isolated local demo adapter.
5. Step 5 deployment/CI: configured the verified Robinhood Chain testnet RPC, added environment-validated deployment tooling, documented the explorer runbook, and added GitHub Actions validation.
6. Step 6 end-to-end mock demo: added a chain-guarded mock deployment script, deterministic mock swap conversion, and viem wallet/contract actions for the testnet UI.
7. Step 7 validation: attempted compilation, contract tests, workspace typechecking, and frontend build. The environment's npm registry returned `403 Forbidden` for `@nomicfoundation/hardhat-toolbox`, leaving dependencies unavailable. As a result, compile/test could not find `hardhat`, and typecheck/build reported missing installed dependencies. `git diff --check` passed and the working tree was clean before documentation updates.
8. Step 8 dependency diagnosis: confirmed there is no usable `node_modules` installation (`.bin`, Hardhat, and Hardhat Toolbox are absent), no lockfile, and an empty npm cache. `npm install --offline` failed with `ENOTCACHED`; the configured registry is `https://registry.npmjs.org/` through the environment proxy. Replacing the Toolbox is technically possible only with its individual Hardhat plugins (ethers, Chai matchers, network helpers, Chai/types), but cannot unblock this environment because no dependencies are locally available and the registry access restriction remains. No dependency or application configuration was changed.
9. Step 9 CI repair (branch `feat/editorial-redesign`): every CI run had been failing on one contract test, `has no cancellation or grant mutation path after funding`. It asserted that `interface.getFunction("cancelGrant")` would throw, but ethers v6 returns `null` for an unknown name, so the assertion could never pass. Replaced it with an assertion over the interface's ABI fragment list, which tests the same invariant without depending on ethers' error behaviour. The contract itself was correct and was **not** changed. Because `npm test` failed first, CI had never reached the frontend typecheck or build steps, so the frontend was previously unvalidated in CI.
10. Step 10 frontend art direction (branch `feat/editorial-redesign`): returned the token set to the Design Spec's cool paper/ink/brass values, restricted type to weights 400/500, removed the letter-spaced all-caps eyebrows and middle-dot meta strings the spec rules out, and rebuilt the landing page as hero → backstop ledger → assurance. The certificate gained a guilloché underprint and a seal that overlaps its outer edge and renders only when the grant is no longer held. The employer and contractor pages inherit the new system; their composition is still the previous layout and is the next task. Two honesty fixes were included: the milestone description is not stored by the contract, so it is now labelled as such on the certificate and kept in browser storage against the grant reference; and the claim action renders only at or after the on-chain deadline, via a new additive `deadlineTimestamp` field on `DemoGrant` (no contract interaction changed).

## Git baseline

- Current branch: `feat/editorial-redesign`
- `main` is at `8ba21f9` (`feat: polish frontend UX and configure Vercel`) and is the deployed Vercel production branch.
- `origin/feat/polished-ui-vercel-main` is fully merged into `main`.
- `origin/codex/inspect-equity-benefit-wallet-project-status-jv0w53` holds an unmerged earlier redesign attempt and is not built on.
- Starting commit before Step 2: `1e99c8c` (`Initialize repository`)

## Implemented contract behavior

- Configures npm workspaces for `contracts` and `frontend`.
- Configures Solidity `0.8.24` with Hardhat.
- Defines the `robinhoodTestnet` Hardhat network with chain ID `46630` and the verified public RPC default.
- Stores employer, contractor, selected token, raw escrow amount, multiplier snapshot, deadline, and status per grant.
- Uses constructor-supplied temporary addresses for USDG, swap adapter, AAPL, TSLA, and NVDA; no real network values are included.
- Limits funding/release to the employer and timeout claim to the stored contractor, with `releaseGrant` requiring a pre-deadline timestamp and `claimAfterTimeout` allowing the exact deadline.
- Stores the stock-token balance delta and transfers that same stored raw amount on either payout path, independent of future multiplier changes.
- Provides `/`, `/employer/fund`, `/employer/grants`, and `/contractor/grant` with explicit mock-asset messaging, EIP-1193 wallet connection, and viem reads/writes against configured test contracts.
- Configures `robinhoodTestnet` at chain ID `46630` using `RH_RPC_URL`, with the verified public RPC as the default and an optional private key.
- Adds `deploy:testnet`, which requires non-zero `USDG`, `SWAP_ADAPTER`, `AAPL`, `TSLA`, and `NVDA` environment values before deployment.
- Adds CI for dependency installation, contract compilation/tests, frontend typecheck, and frontend build. No CI secrets are required.
- Adds `deploy:demo:testnet` to deploy mock USDG, mock AAPL/TSLA/NVDA, MockSwapAdapter, and GrantEscrow only on chain ID `46630`; it prints frontend configuration rather than writing addresses to source control.

## Deployment record

- GrantEscrow testnet address: not deployed; record only after a demo deployment is verified on the explorer.
- 0x route: not configured. 0x supports Robinhood Chain mainnet `4663`, not testnet `46630`.

## Remaining work

- Confirm and incorporate the design/build specifications once available in the project context.
- Review the contract and mock adapter design against the final Design and Build Specs, then perform a security-focused audit before a live deployment.
- Supply and independently verify official testnet USDG, adapter, and stock-token addresses before any deployment.
- Execute the mock deployment in a funded testnet wallet, configure `frontend/.env.local` from its output, and verify the full employer/contractor flow.
- Add any approved USDG/stock-token swap integration only after its requirements and addresses are confirmed.

## Next recommended implementation step

Resolve the npm registry access restriction, install workspace dependencies, and rerun `npm run compile`, `npm test`, `npm run typecheck`, and `npm run build`. Only after those validations pass should the mock deployment and employer/contractor testnet flow be performed. Do not add a 0x testnet route or treat mock assets as real securities.
