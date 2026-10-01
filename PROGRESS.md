# Project Progress

## Current state

The repository contains the project scaffold, MVP `GrantEscrow` core contract/test suite, viem-connected Robinhood Chain testnet mock demo, deployment scripts, and CI workflow. **No testnet deployment address is committed yet** — the deployment is now unblocked and is the next step. The frontend has been rebuilt end to end on **Direction A "The Desk"** per `EBW_DIRECTION_A_DEEPSEEK_SPEC.md`, and that rebuild is now **merged to `main`** at `2fe05d1` (Step 15). Work continues directly on `main` from here.

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

12. Step 12 Direction A implementation (branch `feat/editorial-redesign`, commits `4ab268f` → `f195809`): the frontend visual layer was replaced outright against `EBW_DIRECTION_A_DEEPSEEK_SPEC.md`, in the §15 checkpoint order — tokens and certificate, landing, jurisdiction gate, employer fund, contractor view, register, polish. The certificate is the signature object in five states driven by `data-s` with a separate `data-seal` attribute for the stamp; the desk (radial light pool plus feTurbulence grain) carries the landing hero and the contractor page, and everything else is paper. Brass is the only accent, green appears only on the seal and the Unlocked status, red only on errors. Commit-per-checkpoint, CI green on every one.

    Three deliberate token deviations, all recorded in `frontend/src/styles/tokens.css`:
    - **No `prefers-color-scheme` dark variant.** The light paper / dark desk split *is* the design; auto-inverting `--paper` would destroy it. The spec's own §2 token block lists no dark values, and the mockup's dark block was not ported.
    - **`--red-desk` added.** §6 asks for `--red-soft` on the desk header, but `#8C3B32` on `--desk #0E1830` measures **2.33:1**, well under WCAG AA. §13 makes contrast the governing rule, so a lightened desk error tone is used instead. This is the one place the spec's colour instruction and its contrast rule conflict, and contrast won.
    - **`--line-strong` added.** `--line` is a hairline everywhere else, but the three stock-picker card borders *are* the click targets, and a boundary WCAG 1.4.11 asks to identify measured **1.43:1**. `--line-strong` reaches **3.27:1** while staying quieter than the `--ink` edge of the selected card.

13. Step 13 finding: **released and timeout-claimed were previously indistinguishable.** Both paths set the same `RELEASED` status on chain, so `getGrant` could not tell an employer release from a contractor's automatic claim, and the contractor view would have had to guess. `GrantEscrow.sol:38` emits `GrantReleased(uint256 indexed grantId, address indexed contractor, uint256 rawEscrowAmount, bool timeoutClaim)` from the single private `_release`, so the `timeoutClaim` flag resolves it. `getGrant` now reads that event when the grant is unlocked and adds an optional `releasedBy: "employer" | "timeout"` field to `DemoGrant` (§11.4). If the log read is refused it stays `undefined` and the UI falls back to §11.4's unattributed wording rather than guessing.

14. Step 14 deploy unblocking (branch `feat/editorial-redesign`, commit `e2382fe`): deploying needs Hardhat and solc, which this development machine cannot install, so `.github/workflows/deploy-testnet.yml` was added to run the demo deployment on a GitHub runner — `workflow_dispatch` only, because the job spends testnet ETH from a funded key. It fails early with a readable message when `DEPLOYER_PRIVATE_KEY` is absent and never enables shell tracing, which would print the key. The deploy output is `tee`d into the job summary so the five `VITE_*` addresses are readable without opening the raw log. **Required repository secret: `DEPLOYER_PRIVATE_KEY`.** Two accounts were funded with 0.01 testnet ETH each; see the deployment record.

15. Step 15 merge to `main` (commits `2fe05d1`, `5dd4a5d`): the Direction A redesign was fast-forwarded onto `main`, which had not moved from `8ba21f9`, so the merge was clean and needed no conflict resolution. The branch is 14 commits. Two things this unblocks: **the `Deploy testnet demo` workflow is only listed in the Actions UI once its file is on the default branch**, so it could not be dispatched before this merge; and Vercel's production site now builds the redesign. `main` was previously **red** — the last two runs (`8ba21f9`, `ac94b58`) failed on the contract test repaired in Step 9 — so the green run on `5dd4a5d` is the first green `main` in this repository's history. Daily work continues on `main` from here rather than on a long-lived branch, so integration problems surface as they are introduced instead of at the end.

    Production was then **verified to be serving the redesign**, by fetching the live bundle and stylesheet rather than inferring it from the merge: `/assets/index-Mk3OHyUG.js` and `/assets/index-DkVPWc7A.css` contain the new landing copy, `data-seal`, the jurisdiction gate's demo-only label, and the `--desk` / `--red-desk` / `--cert-seal-ink` / `--line-strong` tokens, while the pre-redesign `cert-core` is absent. `--line-strong` is the decisive marker because it exists only from the §15.7 polish pass onward, so production carries the complete redesign rather than an intermediate checkpoint. This also makes `https://equitywallet-psi.vercel.app` the target for the browser design review in Remaining work item 6, since previews remain behind Deployment Protection.

16. Step 16 rule 9 compliance (commit `a27343f`): auditing `GrantEscrow.sol` against Build Spec §4 line by line found rule 9 only half-implemented. Two of its four requirements were absent. **A zero `minStockOut` was accepted**, which made the existing `rawEscrowAmount >= minStockOut` check vacuous — any output satisfies `>= 0`, so the floor the rule exists to provide did not exist. **The swap carried no transaction deadline**, so `ISwapAdapter.swap` had no bound at all. `fundGrant` now rejects a zero `minStockOut` outright rather than defaulting it, and takes a `swapDeadline` it requires not to be in the past; the interface and `MockSwapAdapter` carry it through so the plumbing is exercised rather than assumed. Three tests were added, and the adapter-level one calls the adapter directly because the escrow's own guard makes the adapter's guard unreachable through `fundGrant` — a test that never reaches the guard would prove nothing. The frontend passes a twenty-minute window from funding time. This changes `fundGrant`'s signature, so the first deployment was superseded and the contracts redeployed (see the deployment record); **the earlier addresses must not be used**.

## Deploying: what is and is not needed

The demo path (`deploy-testnet-demo.ts`) is self-contained — it deploys its own `MockUSDG`, mock AAPL/TSLA/NVDA, `MockSwapAdapter` and `GrantEscrow`, then mints 100,000 mock USDG to the deployer. **No official testnet token addresses are needed**, and the `USDG` / `SWAP_ADAPTER` / `AAPL` / `TSLA` / `NVDA` keys in `.env.example` belong to the *other* script, `deploy-grant-escrow.ts`, which is not the demo path. The only external requirement is native testnet ETH for gas.

**No secret belongs in Vercel.** The frontend reads only `VITE_GRANT_ESCROW_ADDRESS`, `VITE_USDG_ADDRESS`, `VITE_AAPL_ADDRESS`, `VITE_TSLA_ADDRESS`, `VITE_NVDA_ADDRESS` and `VITE_RH_RPC_URL` — all public contract addresses, and all produced by the deploy. `DEPLOYER_PRIVATE_KEY` is needed only for the deploy itself, as a GitHub Actions secret.

## Git baseline

- Current branch: `main` (the redesign was merged here in Step 15; continue on `main`).
- `main` is at `2fe05d1`, the merge of the Direction A redesign and the docs/cleanup commit. This is now the deployed Vercel production branch, so production will build the redesign on the next deploy.
- `feat/editorial-redesign` is fully merged into `main` and is no longer needed as a working branch. Its history: `e0dbc95` (contracts test repair), `4c803bb` (landing rebuilt around the certificate), `4e53e51` (employer + contractor recomposed), the Direction A checkpoints `4ab268f` → `f195809` (certificate, landing, gate, fund, contractor, register, polish), `e2382fe` (deploy workflow), `2fe05d1` (cleanup + docs).
- Before the merge, `main` was at `8ba21f9` (`feat: polish frontend UX and configure Vercel`) and its last two CI runs failed.
- `origin/feat/polished-ui-vercel-main` is fully merged into `main`.
- `origin/codex/inspect-equity-benefit-wallet-project-status-jv0w53` holds an unmerged earlier redesign attempt and is not built on.
- Starting commit before Step 2: `1e99c8c` (`Initialize repository`)

## Security note

While locating a testnet deployer wallet, a private key was printed into an assistant transcript from `~/Documents/ARC_PROJECT/INSIDE_TERMINL_WALLET.txt`. **The wallet at `0xccE7410Ca13459bDcD65845Da22a77f6A2FefC9e` must be treated as compromised** and must not be funded or reused. That file stores keys in plaintext and contains at least one malformed entry, so it should not be relied on as a key store. `~/.observed-secrets/wallet.json` is a **live celo-mainnet** key (`chainId 42220`) and must not be used for this project under any circumstances.

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

**Deployed 2026-10-01** (run `36891460013`). This is the third and current deployment; it is the **only** one whose `GrantEscrow` stores the milestone and the funded USDG amount on chain, so it is the only one a submission may point at. Verified against the Robinhood Chain explorer, not just the job log: `GrantEscrow` reports `is_contract: true`, `creation_status: "success"`, `is_verified: true`, and its creator is the funded deployer.

| Contract | Address |
|---|---|
| GrantEscrow | `0xFf80d1Ce106113cCAEda490b58852E9EA6F28319` |
| MockUSDG | `0x9F8aAfE4Fc2FeED7CC9C7484026acdE09086eCD5` |
| Mock AAPL | `0x06c8DF6D1C41E23B9f7A6c314C1C4e0b3a1eB6dB` |
| Mock TSLA | `0xAcBc1073B47fc8774c7b3E6c2d4E3a93C33726c5` |
| Mock NVDA | `0x65a9376d29c67A4De1269fc317B07cd4A35eE490` |
| MockSwapAdapter | `0xbb83A7FDad0E68E949b79134B4f83Bdc8Ef22C46` |

- GrantEscrow creation tx: `0x2662fc917093badaafee24dbcab2ef5c89aa811cff68d6f1ac65eebb5687d663`
- **Do not use the two earlier deployments.** `0x339a44f967dD1eD1bDBa98Fb4396DaB77e4D3645` (run `36741437572`) and `0xa323e031a9C8107a993a572Af23448696523e6aA` (run `36737126586`) both have the old 7-field `grants()` struct. A frontend built from this repository cannot decode them: viem expects nine return values and will fail the read. `GrantEscrow` `0x339a44f9…` was the live address until 2026-10-01.
- The old deployment's mocks, also superseded: MockUSDG `0x308b3d480199ACcD21c8BE882A5E9F3077D0EaAC`, AAPL `0x17078672b60471957f42A0343d510B1a4e81DC59`, TSLA `0x6993Ef68e09ec698bb8A607Eb24a28060906b27E`, NVDA `0x31bACde94bEa0FE3035227053dbf03a4B029a6fC`, MockSwapAdapter `0x9B097E89cDe2f9DBa4001594C25692b5a5e5a529`.
- Deployer `0xe5Fe9119000C9E1113dc504891A83Da7bbaa7a7b` is at `0.0098463313` testnet ETH after three deploys — about `0.000154` ETH spent in total, against `0.01` funded. Roughly 65 deploys remain affordable.
- **All six contracts are verified on the explorer** (re-confirmed for the 2026-10-01 deployment), by querying `module=contract&action=getsourcecode` directly rather than trusting the job log: GrantEscrow, MockUSDG, MockSwapAdapter, and the three MockStockTokens all return a non-empty `SourceCode`. Build Spec §6's explorer-verified item is satisfied. Re-runnable via the **Verify contracts on the explorer** workflow.
  - The first verify run reported **success while verifying nothing**. `npx hardhat` was invoked from the repo root, where there is no `hardhat.config.ts`, so it aborted with `HH1: You are not inside a Hardhat project` — and the step piped through `tee`, whose exit status is always 0, so the abort could not fail the job. Both faults are now fixed (`working-directory: contracts`, `set -o pipefail`), and the same pipe was corrected in the deploy and two-wallet workflows. **A green check is only evidence if the log shows the work happening.**
- These are **mock** assets deployed by the demo script. They are not real securities and not the official USDG.
- The addresses are public configuration, not secrets, and are mirrored in the README's "Deployed contracts" section.

### Frontend configuration

The frontend reads its configuration through `import.meta.env[name]` inside `requiredAddress()` in `frontend/src/chainAdapter.ts`. That dynamic lookup was checked against the built bundle rather than assumed: Vite compiles `import.meta.env` into a real object literal (`...VITE_VERCEL_ENV:"production",...`), so a var set in Vercel at build time **is** reachable by dynamic key. Set these five in the Vercel project and redeploy:

```
VITE_GRANT_ESCROW_ADDRESS=0xFf80d1Ce106113cCAEda490b58852E9EA6F28319
VITE_USDG_ADDRESS=0x9F8aAfE4Fc2FeED7CC9C7484026acdE09086eCD5
VITE_AAPL_ADDRESS=0x06c8DF6D1C41E23B9f7A6c314C1C4e0b3a1eB6dB
VITE_TSLA_ADDRESS=0xAcBc1073B47fc8774c7b3E6c2d4E3a93C33726c5
VITE_NVDA_ADDRESS=0x65a9376d29c67A4De1269fc317B07cd4A35eE490
```

`VITE_RH_RPC_URL` defaults to the public testnet RPC in `chainAdapter.ts` and does not need to be set.

**A sixth var is optional but worth setting for judging:** `VITE_JUDGE_GRANT_ID`. When it holds a grant number, the landing page offers a "View a live testnet certificate" link straight to that certificate. Without it the link simply does not render — no broken state.

Until those are set, the deployed site throws `Missing or invalid VITE_GRANT_ESCROW_ADDRESS` on the employer and contractor routes. That message previously pointed only at `frontend/.env.local`, which is the wrong instruction for a deployed build; it now names the deployment environment too.

**The 2026-10-01 contract change makes the Vercel variables load-bearing, not cosmetic.** The frontend's `grants` ABI now expects the nine-field struct. If Vercel still holds `0x339a44f9…`, the read does not return a stale-but-plausible certificate — viem cannot decode the seven-value return against a nine-output ABI and throws. That presents as a broken `/contractor/grant` and `/employer/grants`, and it is the expected symptom until the five values above are pasted in and the site is redeployed.

- 0x route: not configured. 0x supports Robinhood Chain mainnet `4663`, not testnet `46630`.

## Remaining work

Ordered by what the submission checklist in the Build Spec §6 actually scores. Submissions close **4 Oct 2026**.

1. ~~**Verify the deployed contracts on the explorer.**~~ **Done 2026-09-30** — all six verified, confirmed against the explorer's own API. See the deployment record.
2. ~~**Update the five `VITE_*` addresses in Vercel and redeploy.**~~ **Done 2026-09-30 for the second deployment** — verified against the live production bundle on `/assets/index-BppQ0zLR.js`. **Then reopened on 2026-10-01**: the third deployment replaced every address, so the five values must be pasted again. See "Frontend configuration" for why the site is broken until they are.
3. ~~**End-to-end test with two separate wallets.**~~ **Done 2026-09-30 against the second deployment — 10/10 checks passed.** Re-run against the third deployment (run dispatched 2026-10-01); see the end-to-end report for the result. `CONTRACTOR_PRIVATE_KEY` is a repository secret.
   - The run independently confirmed the contractor address is `0x49B4f09C5894c1C90B0ca9099AF3De0Faf7f3037` and the employer `0xe5Fe9119…`, so this exercises two genuinely distinct accounts.
   - It created **two real grants** on the deployed escrow (10 AAPL released by the employer, 5 AAPL claimed after timeout), leaving the contractor holding 15 mock AAPL. That is live testnet state, not a simulation.
   - It also asserts the negative cases by attempting them and requiring a revert: the employer cannot release after the deadline, and a released grant cannot be claimed twice.
   - The contractor address is easy to mistype: it ends `...0Faf7f3037`, and `...0Fad7f3037` is a different, empty account. It is read from `RECOURSE/.secrets/relayer.json`, which is the authority — copy it from there rather than from any prose.
4. **Security pass against Build Spec §4 rules 1–15**, written up as the README security section so a judge scoring contract quality sees the reasoning. Rules 1–6, 8, 10–11, 13–14 are already reflected in `GrantEscrow.sol` and its tests; the split-during-escrow test that rule 6 demands explicitly exists. Rules 7, 9, 12, 15 need a documented position rather than an assumption — see below.
5. **README**: plain-language concept (reuse the landing copy), security section, out-of-scope statement, the Robinhood Chain reserved-slot note, and the USDG integration note. It can now cite the deployed GrantEscrow address from the deployment record.
6. **Demo video** showing the full loop.
7. **Design review of the redesign in a browser.** Static inspection and a green build are not visual validation. The §15.7 polish pass did a *static* audit of motion, contrast, small-screen behaviour and keyboard order, and fixed what it found, but **no browser has rendered this build at 320/390/768/1440, and the console has not been observed.** Since the merge in Step 15, `https://equitywallet-psi.vercel.app` builds from `main` and is publicly reachable, so this can now be done in any browser — preview deployments remain behind Vercel Deployment Protection, but the production URL is not.
   - Static checks against the **shipped** stylesheet (`/assets/index-DkVPWc7A.css`, 24 KB) do pass: all five `data-s` states are styled, `data-seal` is present, the desk/paper surfaces ship as the `.on-desk`/`.on-paper` classes, breakpoints exist at 480/560/860 px width and 780 px height, and `prefers-reduced-motion: reduce` is honoured. That is a check that the design system *reached the bundle* — it says nothing about how any of it looks.
   - **A landing-page review prompt circulated on 2026-09-30 described a build that does not match this one.** Of its ten claims, two were real and both are now fixed: the footer printed the testnet notice twice (`Footer.tsx` and a hard-coded "Robinhood Chain Testnet, mock contracts only"), and the timeline baseline ran to `right: 0` across a `1fr 1fr 1fr` grid, overshooting the third dot at 66.667%. Four were false — the width cap, the h1 clamp, the wallet-label ellipsis and the "hard-coded" October date — and five (hero height, strap overlap, notice spacing, trust width, brass underline) need a rendered browser to judge. Verify against `--gutter` and the shipped CSS before acting on any similar report.

### Build Spec items needing an explicit position before submission

- **Rule 9 (0x swap).** §3 states the swap goes through the 0x Swap API, "confirmed live on Robinhood Chain". 0x supports Robinhood Chain mainnet (`4663`) but not testnet (`46630`), so the project uses `MockSwapAdapter` on testnet instead. This is a real deviation from the spec and must be stated plainly in the submission rather than presented as 0x integration.
- **Rule 15 (jurisdiction gate).** **Built** (Step 12), in `frontend/src/components/JurisdictionGate.tsx` plus `config/jurisdiction.ts` and `hooks/useJurisdiction.ts`. It blocks the three gated routes until a region is chosen, is a `role="dialog"` with a focus trap, and is deliberately not dismissible (no close button, Esc does nothing). It carries the required verbatim demo-only label in every state: "Demo-only check. This is a placeholder on the frontend, not a real compliance control. It verifies nothing." The footer repeats that the check is demo-only on gated routes, and the README has a section saying the same. The region list is an **illustrative placeholder**, not a compliance list, and one region (United States) is deliberately blocked so the blocked state is reachable; the project owner must replace the list or remove the gate before any real use.
- **Rule 7 (`tokenSelectionLocked`).** The contract has no such flag; it achieves the same guarantee structurally, because no function can mutate a funded grant's `selectedToken`. Confirm that framing is acceptable and document it.
- **Rule 12 (`Math.mulDiv`).** The escrow performs no fixed-point conversion — the adapter owns conversion — so `mulDiv` may not apply. Document the rounding position rather than claiming a rule is satisfied that has no corresponding code.

## Next recommended implementation step

The deploy is done. The immediate next step is to **set the five `VITE_*` addresses in Vercel and redeploy**, then open the employer route and confirm the frontend reads them rather than throwing — until that happens the deployed site is not usable. After that, run the two-wallet end-to-end flow (fund → release, and fund → timeout claim), which is Build Spec day 8 and the last thing standing between here and the README and demo video.

Do not add a 0x testnet route and do not treat mock assets as real securities.

The temporary `/__cert` verification route and its `CertGallery` page were removed before the merge; the route list is now exactly the four product routes.
