# Equity Benefit Wallet — Durable Context

## Product

Equity Benefit Wallet is a hackathon MVP for helping employers issue and manage equity-related benefits for contractors through a wallet-oriented experience.

## Hackathon submission context

- Event: **Arbitrum Open House Singapore, Online Buildathon** — competing for the Robinhood Chain reserved prize slot.
- Submissions close **4 October 2026**. The Build Spec was written 24 Sep 2026 against a 10-day plan, so the plan's day numbers no longer match the calendar.
- The two original specs live **outside the repository** (`equity-benefit-wallet-design-spec.md`, `equity-benefit-wallet-build-spec.md`) and are not committed. Build Spec §5 is the day-by-day plan and §6 is the submission checklist; those unchecked items are the definition of done, not the frontend polish.
- The checklist requires: a deployed, explorer-verified testnet contract; a public repo with a plain-language README plus a security section; a demo video of the whole loop; and explicit written notes on the Robinhood Chain slot, the USDG integration, and what is out of scope.

## Vercel deployment

- Production is `https://equitywallet-psi.vercel.app`, served from `main`. It has been confirmed publicly reachable and confirmed to **not** contain any of the redesign.
- **Preview deployments are behind Vercel Deployment Protection.** Any preview URL returns Vercel's "Login – Vercel" page with HTTP 200 to an unauthenticated client, so HTTP status checks and `curl` cannot validate a preview, and every route appears to return 200. Visual validation of a preview requires a browser signed in to Vercel. Do not report a preview as validated on the strength of a 200.

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
- **The wallet `0xccE7410Ca13459bDcD65845Da22a77f6A2FefC9e` is compromised.** Its private key was printed in full into an assistant transcript while locating a testnet deployer. Never fund it, never deploy with it, never reuse it. The key came from `~/Documents/ARC_PROJECT/INSIDE_TERMINL_WALLET.txt`, which stores keys in plaintext and contains at least one malformed entry, so it is not a trustworthy key store.
- `~/.observed-secrets/wallet.json` holds a **live celo-mainnet** key (`chainId 42220`). It must never be used for this project.
- When masking keys in shell output, match whole lines by `/private\s*key|secret|mnemonic|seed/i` and any 32+ hex run **without** word boundaries — a trailing-word-boundary regex (`\b0x[a-fA-F0-9]{64}\b`) can be defeated by an adjacent character and leak the key.
- Never enable shell tracing (`set -x`) in the deploy workflow; it would print the deployer key into the job log.

## Implemented contract architecture and invariants

- `GrantEscrow` accepts constructor-supplied USDG, trusted swap-adapter, AAPL, TSLA, and NVDA addresses. This is temporary testnet wiring; these values must be verified and replaced only from official deployment inputs.
- `createGrant` records the caller as employer. Only that employer can fund or release; only the stored contractor can claim at/after the deadline.
- Funding accepts USDG, permits only the three constructor-supplied stock tokens, calls the explicit `ISwapAdapter`, clears the adapter allowance afterward, and records the received raw stock-token balance delta.
- The selected token and deadline are fixed once funding succeeds because no mutation functions exist and grants can only be funded from `CREATED`.
- A stock token's `uiMultiplier()` is read exactly once at funding and retained for display/audit context only. Release and timeout claim transfer the stored `rawEscrowAmount` exactly and never recalculate a payout from a multiplier.
- Both payout paths are non-reentrant, transition to `RELEASED` before the token transfer, and always pay the stored contractor.
- Focused static review in Step 5 found no objective issue requiring a contract change: state transitions, access checks, exact raw payout, allowance reset, and payout reentrancy protection match the current MVP requirements.
- The trusted swap adapter remains the only swap boundary. 0x supports Robinhood Chain mainnet (`4663`) but not testnet (`46630`), so no 0x testnet route is configured.
- **Both payout paths end in the same on-chain `RELEASED` status**, so status alone cannot tell an employer release from a contractor's timeout claim. `GrantEscrow.sol` emits `GrantReleased(grantId, contractor, rawEscrowAmount, timeoutClaim)` from the single private `_release`, so `getGrant` reads that event for an unlocked grant and adds an optional `releasedBy: "employer" | "timeout"` to `DemoGrant` (§11.4). If the log read is refused the field stays `undefined` and the UI uses unattributed wording rather than guessing.

## UI/design constraints

The frontend was rebuilt on **Direction A "The Desk"** (`EBW_DIRECTION_A_DEEPSEEK_SPEC.md`). The notes below describe the current system; anything that contradicts them is stale.

- The frontend has exactly four routes: `/` (landing), `/employer/fund`, `/employer/grants`, `/contractor/grant`. A temporary `/__cert` verification route existed during the build and has been removed; do not reintroduce it.
- **Two surfaces.** The *desk* (navy, radial light pool, feTurbulence grain) carries the landing hero and the contractor page. Everything else is *paper*. Brass is the only accent; green appears only on the seal and the Unlocked status; red only on errors.
- **The certificate is the signature object.** Landscape `aspect-ratio: 1.42`, `max-width: 640px` (720px on the contractor view), never rotated. Five states driven by `data-s` (`draft | held | released | claimed | unloaded`), with a *separate* `data-seal="on|off"` attribute driving the stamp, because the seal is transition-driven rather than a keyframe so that removing it animates back out.
- The certificate's physical shadow and the seal are the only two shadows in the product. Gradients are permitted only on the desk light pool and the certificate's band pattern.
- Type is Fraunces and Inter at weights 400/500 only. Prohibited and **must not be reintroduced**: letter-spaced all-caps eyebrows/kickers, middle-dot meta strings, decorative icons beyond the six in `components/icons.tsx`, padlocks, arrows on buttons, numbered lists outside the funding-progress list and the landing timeline, tickers on any certificate face, and more than one primary action per screen.
- **No disabled buttons**: an unavailable action is either absent with explanatory text beside it, or present with `aria-disabled` and an inert handler. Hover is `opacity: .85` and nothing else.
- The six icons live only in `components/icons.tsx` (20x20 viewBox, `fill="none"`, `stroke="currentColor"`, `stroke-width={1.5}`, square caps, mitre joins, `aria-hidden`). `components/Rosette.tsx` holds the seal's generated guilloché rosette, which is a graphic mark rather than an icon, and strokes `currentColor`.
- Three deliberate token deviations, documented in `styles/tokens.css`: **no `prefers-color-scheme` dark variant** (the paper/desk split *is* the design); **`--red-desk`** (spec §6 asks for `--red-soft` on the desk, but `#8C3B32` on `--desk` measures 2.33:1, and §13 makes contrast governing); **`--line-strong`** (the stock-picker card borders are the click targets, and `--line` measured 1.43:1 against WCAG 1.4.11's 3:1).
- Below 560px the certificate drops its fixed `aspect-ratio` and becomes content-sized rather than clipping its own text. It stays landscape in practice. The reference `No. 0042` wraps to a second line below 480px rather than being hidden.
- The `UNLOCKED` status is still not reachable from chain data: `GrantEscrow.Status` is `CREATED | FUNDED | RELEASED`, so `chainAdapter` maps `1 → LOCKED` and `2 → CLAIMED`. In Direction A the certificate surfaces these as the `held` and `released`/`claimed` states.
- **The milestone description is not stored on-chain.** The `Grant` struct has no milestone field and `fundGrant` does not accept one. The frontend keeps the description in browser `localStorage` against the grant reference and labels it honestly where it is unavailable. Adding an on-chain milestone field would be a contract change and needs explicit approval.
- **Amounts follow one rule, in `frontend/src/local.ts`.** The contract stores the stock quantity, not the USDG amount, so a dollar figure is shown *only* where this browser recorded the USDG amount at funding time (`ebw.usdg.<id>`). Everywhere else the figure is the token quantity with no dollar sign. A dollar figure is never invented. The fund page, the contractor certificate and the register all call one function so the rule cannot drift.
- `DemoGrant` exposes `deadlineTimestamp` (unix seconds) so the UI can tell whether the timeout claim is available, `employerAddress`/`contractorAddress` so it can derive the viewer's role, and `releasedBy: "employer" | "timeout"` so it can tell the two payout paths apart. `releaseGrant` is employer-only and pre-deadline; `claimAfterTimeout` is contractor-only and at/after the deadline, so exactly one action is ever valid.
- **The jurisdiction gate** (`components/JurisdictionGate.tsx`) is built and wraps the three gated routes. It is a `role="dialog"` with a focus trap, deliberately not dismissible (no close button, Esc does nothing), and carries the required verbatim demo-only label in every state. Its region list is an **illustrative placeholder, not a compliance list**, and the project owner must replace it or remove the gate before any real use.

## Explicitly out of scope for this scaffold

- USDG-to-stock-token swapping and 0x integration
- Wallet connection, signing, or transaction flows
- Mainnet deployment or use of real securities/token addresses
- AI/LLM features and paid services

## Current toolchain

npm workspaces; Hardhat, Solidity `0.8.24`, and TypeScript for contracts; React, TypeScript, and Vite for the frontend.

**This development machine cannot build the project.** It has 8 GB of RAM and no usable `node_modules`; `node_modules` and `package-lock.json` were deliberately deleted and must not be reinstalled locally. Do not run `npm install` on this machine. Validate and deploy through GitHub Actions (`ci.yml` for validation, `deploy-testnet.yml` for the deploy); Vercel builds the frontend. CI status is read via the GitHub API — the `gh` CLI is **not** installed.

## Testnet mock demo

- `deploy:demo:testnet` checks chain ID `46630`, deploys MockUSDG, mock AAPL/TSLA/NVDA, MockSwapAdapter, and GrantEscrow, and mints initial mock USDG to the deployer.
- The mock adapter is deterministic: its default rate is 1:1 at 18 decimals and it enforces `minStockOut`. The existing fixed-output mode is retained solely for unit tests.
- The demo contract addresses are never committed; copy the script output into the frontend's environment values after deployment.
- `.github/workflows/deploy-testnet.yml` runs that deploy on a GitHub runner, by **manual dispatch only** (it spends testnet ETH from a funded key, so it never runs on push or PR). It fails early with a readable message when `DEPLOYER_PRIVATE_KEY` is absent, and appends the deploy output to the job summary so the five `VITE_*` addresses are readable without opening the raw log. **Required repository secret: `DEPLOYER_PRIVATE_KEY`.**
- `workflow_dispatch` workflows are listed in the Actions UI only once the file is present on the **default branch**. This is why the deploy workflow has to reach `main` before it can be dispatched.
- Because the demo deploys its own mock tokens, **no official testnet token addresses are needed** and only native testnet ETH for gas is required. The `USDG` / `SWAP_ADAPTER` / `AAPL` / `TSLA` / `NVDA` keys in `.env.example` belong to the separate `deploy-grant-escrow.ts` path, not the demo.
- **No secret belongs in Vercel.** The frontend reads only public `VITE_*` contract addresses and `VITE_RH_RPC_URL`.

## Deployment record

- **GrantEscrow testnet address: not deployed yet.** Record it only after a demo deployment is confirmed on the explorer.
- Two testnet accounts are funded on chain `46630`, **0.01 ETH each**. Gas is ~0.01 gwei and the deploy is roughly 7 transactions needing about 0.00012 ETH, so this is ~80× the requirement:
  - Employer / deployer `0xe5Fe9119000C9E1113dc504891A83Da7bbaa7a7b` (`RECOURSE/.secrets/deployer.json`)
  - Contractor `0x49B4f09C5894c1C90B0ca9099AF3De0Faf7f3037` (`RECOURSE/.secrets/relayer.json`)
- **Not** `0xccE7410Ca13459bDcD65845Da22a77f6A2FefC9e` — that wallet is compromised, see Security constraints.

## Build Spec items that need a stated position, not an assumption

These are places where the Build Spec and the implemented reality diverge. Each needs to be written down plainly in the submission rather than glossed over.

- **Rule 9 (0x swap).** §3 says the swap runs through the 0x Swap API, "confirmed live on Robinhood Chain". 0x covers Robinhood Chain mainnet (`4663`) but not testnet (`46630`), so testnet uses `MockSwapAdapter`. Never describe this as 0x integration.
- **Rule 15 (jurisdiction gate).** **Built** (Step 12), in `frontend/src/components/JurisdictionGate.tsx` plus `config/jurisdiction.ts` and `hooks/useJurisdiction.ts`. It blocks the three gated routes until a region is chosen, is a `role="dialog"` with a focus trap, and is deliberately not dismissible (no close button, Esc does nothing). It carries the required verbatim demo-only label in every state: "Demo-only check. This is a placeholder on the frontend, not a real compliance control. It verifies nothing." The region list is an **illustrative placeholder**, not a compliance list, and one region (United States) is deliberately blocked so the blocked state is reachable; the project owner must replace the list or remove the gate before any real use.
- **Rule 11.4 (release attribution).** Resolved in code — see `releasedBy` above. Both payout paths set the same `RELEASED` status, so the `GrantReleased` event's `timeoutClaim` flag is the only way to distinguish them.
- **Rule 7 (`tokenSelectionLocked`).** There is no such flag. The same guarantee holds structurally — no function can mutate a funded grant's `selectedToken` — so describe the guarantee, not the flag.
- **Rule 12 (`Math.mulDiv`).** The escrow does no fixed-point conversion, because the adapter owns conversion. `mulDiv` may have no corresponding code; document the rounding position instead of claiming compliance.
