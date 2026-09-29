# Project Progress

## Current state

The repository contains the project scaffold, MVP `GrantEscrow` core contract/test suite, viem-connected Robinhood Chain testnet mock demo, deployment scripts, and CI workflow. No testnet deployment address is committed. CI is green, and all four frontend routes have been recomposed onto the new art direction, both on `feat/editorial-redesign`. Nothing is merged to `main`; the deployed production site still serves `main` at `8ba21f9`.

Target: **Arbitrum Open House Singapore, Online Buildathon** (Robinhood Chain reserved slot). Submissions close **4 Oct 2026**. See `equity-benefit-wallet-build-spec.md` §5 for the day-by-day plan and §6 for the submission checklist — the unchecked items there are the remaining work.

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

11. Step 11 employer + contractor recomposition (branch `feat/editorial-redesign`, commit `4e53e51`): both routes had inherited the new tokens but kept the previous layout, so they were composed for their own job. `/employer/fund` now uses a radio grid for the stock choice rather than a dropdown, sets the USDG amount as a Fraunces numeral, and replaces the static review slip with the certificate itself built live from the form and `position: sticky` beside it; `Certificate` gained a `draft` mode so a preview can never read as an issued instrument. `/employer/grants` became a register opened by reference — the contract exposes grants by ID but offers no enumeration, and the page now says so — passing the ID to the contractor view via `?id=`. `/contractor/grant` became certificate-first: the intro block is a thin utility strip, the terms definition list was removed because it restated fields already on the certificate, and the claim panel carries the single state heading. No contract interaction changed and `chainAdapter.ts` was not touched. CI (`validate`) is green on this commit.

## Git baseline

- Current branch: `feat/editorial-redesign`
- Branch commits: `e0dbc95` (contracts test repair), `4c803bb` (landing rebuilt around the certificate), `4e53e51` (employer + contractor recomposed).
- `main` is at `8ba21f9` (`feat: polish frontend UX and configure Vercel`) and is the deployed Vercel production branch. Production has been confirmed to still serve this build; none of the redesign is in production.
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

Ordered by what the submission checklist in the Build Spec §6 actually scores. Submissions close **4 Oct 2026**.

1. **Deploy to Robinhood Chain testnet and verify on the explorer.** Nothing is deployed. This is the first unchecked item on the checklist and blocks the end-to-end test, the demo video, and the README's contract address.
2. **End-to-end test with two separate wallets** (Build Spec day 8): fund → release, and fund → timeout claim. Requires (1).
3. **Security pass against Build Spec §4 rules 1–15**, written up as the README security section so a judge scoring contract quality sees the reasoning. Rules 1–6, 8, 10–11, 13–14 are already reflected in `GrantEscrow.sol` and its tests; the split-during-escrow test that rule 6 demands explicitly exists. Rules 7, 9, 12, 15 need a documented position rather than an assumption — see below.
4. **README**: plain-language concept (reuse the landing copy), security section, out-of-scope statement, the Robinhood Chain reserved-slot note, and the USDG integration note.
5. **Demo video** showing the full loop.
6. **Design review of the redesign on a Vercel preview in a browser.** Static inspection and a green build are not visual validation; this has not been done.

### Build Spec items needing an explicit position before submission

- **Rule 9 (0x swap).** §3 states the swap goes through the 0x Swap API, "confirmed live on Robinhood Chain". 0x supports Robinhood Chain mainnet (`4663`) but not testnet (`46630`), so the project uses `MockSwapAdapter` on testnet instead. This is a real deviation from the spec and must be stated plainly in the submission rather than presented as 0x integration.
- **Rule 15 (jurisdiction gate).** The spec requires a frontend demo-only jurisdiction gate that is openly labelled as not a real compliance control. **No such gate exists in the frontend.** Either add it as an explicitly-labelled demo stub, or state in the submission that it was not built.
- **Rule 7 (`tokenSelectionLocked`).** The contract has no such flag; it achieves the same guarantee structurally, because no function can mutate a funded grant's `selectedToken`. Confirm that framing is acceptable and document it.
- **Rule 12 (`Math.mulDiv`).** The escrow performs no fixed-point conversion — the adapter owns conversion — so `mulDiv` may not apply. Document the rounding position rather than claiming a rule is satisfied that has no corresponding code.

## Next recommended implementation step

Deploy the mock demo to Robinhood Chain testnet with `npm run deploy:demo:testnet` from a funded wallet, record the printed addresses, set them as Vercel environment variables, and run the two-wallet end-to-end flow. Everything still outstanding on the checklist depends on that deployment. Do not add a 0x testnet route and do not treat mock assets as real securities.
