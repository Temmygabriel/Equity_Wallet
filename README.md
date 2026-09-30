# Equity Benefit Wallet

An employer wants to pay a contractor in stock. The contractor wants to know the stock is really there and can't be pulled back. Neither wants to argue about it later.

Equity Benefit Wallet is one contract that holds the bonus until one of two things happens.

**The employer confirms the work.** One transaction, before the date. The stock goes straight to the contractor's own wallet.

**The deadline passes unreleased.** The bonus becomes claimable by the contractor. One transaction, on or after the date. No lawyer, no dispute.

The employer picks the stock and the deadline up front. The contract holds it. Once funded, nobody can pull it back — there is no cancellation path, no admin override, and no upgrade. What the contractor sees is a certificate showing exactly what is held and when it becomes theirs.

This is a hackathon MVP built for **Arbitrum Open House Singapore, Online Buildathon**, targeting the **Robinhood Chain reserved prize slot**. It runs on Robinhood Chain testnet against mock assets. It is not a product, and nothing in it handles real securities or real money.

For the toolchain, architecture, and deployment mechanics, read on.

## Toolchain

- **Smart contracts:** Solidity with Hardhat and TypeScript
- **Frontend:** React, TypeScript, and Vite
- **Target network:** Robinhood Chain testnet (chain ID `46630`)
- **Package manager:** npm workspaces

## Repository layout

```text
contracts/       Solidity sources, Hardhat tests, and deployment scripts
frontend/        Vite + React application
docs/            Shared product and technical documentation
MEMORY.md        Durable project context and constraints
PROGRESS.md      Project handoff and implementation status
```

## Deployed contracts

Live on **Robinhood Chain testnet** (chain ID `46630`), deployed 30 September 2026.

| Contract | Address |
|---|---|
| **GrantEscrow** | [`0x339a44f967dD1eD1bDBa98Fb4396DaB77e4D3645`](https://explorer.testnet.chain.robinhood.com/address/0x339a44f967dD1eD1bDBa98Fb4396DaB77e4D3645) |
| MockUSDG | [`0x308b3d480199ACcD21c8BE882A5E9F3077D0EaAC`](https://explorer.testnet.chain.robinhood.com/address/0x308b3d480199ACcD21c8BE882A5E9F3077D0EaAC) |
| Mock AAPL | [`0x17078672b60471957f42A0343d510B1a4e81DC59`](https://explorer.testnet.chain.robinhood.com/address/0x17078672b60471957f42A0343d510B1a4e81DC59) |
| Mock TSLA | [`0x6993Ef68e09ec698bb8A607Eb24a28060906b27E`](https://explorer.testnet.chain.robinhood.com/address/0x6993Ef68e09ec698bb8A607Eb24a28060906b27E) |
| Mock NVDA | [`0x31bACde94bEa0FE3035227053dbf03a4B029a6fC`](https://explorer.testnet.chain.robinhood.com/address/0x31bACde94bEa0FE3035227053dbf03a4B029a6fC) |
| MockSwapAdapter | [`0x9B097E89cDe2f9DBa4001594C25692b5a5e5a529`](https://explorer.testnet.chain.robinhood.com/address/0x9B097E89cDe2f9DBa4001594C25692b5a5e5a529) |

Live frontend: **https://equitywallet-psi.vercel.app**

**These are mock assets deployed by the demo script.** They are not real securities, not real USDG, and have no value. Every address above is **source-verified on the explorer**, so each link opens on readable Solidity rather than bytecode.

## Setup

1. Copy `.env.example` to `.env` and provide only the values needed for local deployment work.
2. Install workspace dependencies with `npm install`.
3. Run the available checks:

   ```bash
   npm run typecheck
   npm run compile
   npm test
   npm run build
   ```

## Run the frontend demo

After installing dependencies, start the Vite application from the repository root:

```bash
npm run dev --workspace frontend
```

Open the local URL reported by Vite. The demo includes `/`, `/employer/fund`, `/employer/grants`, and `/contractor/grant`. After deploying the supported mock contracts and configuring `frontend/.env.local`, it connects an EIP-1193 wallet, reads the configured testnet contracts, and submits testnet transactions. It does not support real securities, production custody, or mainnet use.

## Testnet deployment

Robinhood Chain testnet uses chain ID `46630`, public RPC `https://rpc.testnet.chain.robinhood.com`, and explorer `https://explorer.testnet.chain.robinhood.com`.

1. Fund the local deployer wallet with Robinhood Chain **testnet ETH**. The deploy is about seven transactions and costs roughly `0.00004` ETH at the current gas price.
2. Copy `.env.example` to `.env`. `RH_RPC_URL` defaults to the verified public testnet RPC; set `DEPLOYER_PRIVATE_KEY` locally and never commit it.
3. Run `npm run deploy:demo:testnet --workspace contracts`. **This is the supported route** — see the next section for why.
4. Verify the deployed contract on the [Robinhood Chain testnet explorer](https://explorer.testnet.chain.robinhood.com).

There is a second script, `npm run deploy:testnet`, which deploys only `GrantEscrow` against **externally supplied** USDG, swap-adapter, AAPL, TSLA, and NVDA addresses. It is not the demo path and it will not work against the mock deployment, because those mocks are created by the demo script. It exists for a future deployment against real, verified addresses.

The swap adapter remains an explicit contract boundary. 0x Swap API support is currently available for Robinhood Chain mainnet (`4663`), **not** testnet (`46630`); this repository does not claim or attempt a testnet 0x route.

## End-to-end mock demo

This is the supported Robinhood Chain **testnet** demonstration. It deploys mock USDG and mock AAPL/TSLA/NVDA contracts; these assets are not real securities.

1. Set `DEPLOYER_PRIVATE_KEY` in root `.env` and fund that account with Robinhood Chain testnet ETH.
2. Run `npm run deploy:demo:testnet --workspace contracts`. The script deploys MockUSDG, mock stock tokens, MockSwapAdapter, and GrantEscrow, then prints `VITE_*` values and chain ID `46630`.
3. Copy the printed `VITE_*` values into `frontend/.env.local` for local work, or into the hosting project's environment variables for a deployed build. They are public contract addresses, not secrets. Do not make up addresses.
4. Run `npm run dev --workspace frontend`, connect an EIP-1193 wallet on Robinhood Chain Testnet (`46630`), and open `/employer/fund`.
5. As the employer, enter a contractor address, future deadline, test stock, and USDG amount, then sign create/approve/fund transactions. The deployer receives initial mock USDG.
6. Open `/contractor/grant`, load the returned Grant ID, then have the employer use **Release now** before the deadline or the stored contractor use **Claim it yourself** at/after the deadline.

The mock adapter converts USDG to the selected mock stock deterministically at a 1:1 18-decimal rate unless changed for a test. It enforces `minStockOut`; no 0x route is involved.

## Jurisdiction gate

The three app routes (`/employer/fund`, `/employer/grants`, `/contractor/grant`) open a jurisdiction gate before any of their content is rendered. The landing page is ungated.

**It is a demo-only restriction. It is not a compliance control and it verifies nothing.** It runs entirely in the browser, checks the answer against a constant in the source, and sends nothing anywhere. Every screen it appears on says so, and the footer on a gated page repeats it.

- The region list and the blocked list are illustrative placeholders in `frontend/src/config/jurisdiction.ts`. They are not legal advice, not a sanctions list, and not a real eligibility list. **The project owner must replace them, or remove the gate, before any real use.**
- Passing the gate is remembered in `sessionStorage` under `ebw.jurisdiction`, so it is asked once per browser session. A blocked choice is never stored: a reload asks again.
- If `sessionStorage` is unavailable, the gate simply re-asks; nothing else changes.

## Security

The Build Spec §4 sets fifteen rules and calls them non-negotiable. Below is where each one lives in the code, and — where the rule names something that does not exist here — what actually provides the guarantee. Rules that are satisfied structurally rather than by a named flag, and the one rule that does not apply, are stated as such rather than claimed.

The contract is `contracts/contracts/GrantEscrow.sol`, about 125 lines. It is deliberately small enough to read in full.

**1. `releaseGrant` takes only `grantId`.** It accepts no recipient, token, or amount. Every value it pays comes from stored grant state, so a caller cannot redirect the payout or change its size.

**2. Effects precede interactions, with `nonReentrant` on both payout paths.** `_release` sets `RELEASED` before the token transfer, and both `releaseGrant` and `claimAfterTimeout` carry the guard. A reentrant call therefore finds the grant already released and cannot double-pay. Two tests drive a malicious stock token that re-enters during transfer and assert the payout is still paid exactly once.

**3. `claimAfterTimeout` takes no recipient.** It always pays `grant.contractor`, and the boundary is inclusive (`block.timestamp >= grant.deadline`), so the contractor is not locked out during the exact deadline second.

**4. There is no `FUNDED → CANCELLED` transition.** No cancellation function exists at all, under any authority. A test asserts over the contract's ABI fragment list that no cancellation or mutation entry point is exposed.

**5. The deadline is set once at creation and is never mutable.** No function writes `grant.deadline` after `createGrant`, so there is no employer-only extension for a half-secure version to get wrong.

**6. The multiplier/accounting invariant.** Entitlement is the exact raw token amount measured at funding, and release never recomputes from a current multiplier. `fundGrant` reads `uiMultiplier()` once, at funding, and stores it for display and audit only; `_release` transfers `grant.rawEscrowAmount` unchanged. The test `does not recompute payout after the multiplier changes` performs exactly the split-during-escrow scenario the rule asks for — it multiplies the token's multiplier by 99 between funding and release and asserts the contractor still receives the original amount.

**7. Token selection is locked at funding.** There is no `tokenSelectionLocked` flag. The guarantee is structural instead: `selectedToken` is written only inside `fundGrant`, which requires `status == CREATED` and moves the grant to `FUNDED`, and no function can write it afterwards. A later change to the allowlist cannot reach an already-funded grant. The guarantee is the same; the flag is not.

**8. Only the three canonical addresses are accepted.** `_isSupportedStock` compares against the immutable `aapl`, `tsla`, and `nvda` addresses set in the constructor. A caller-supplied token address cannot be funded. A test funds with an otherwise-valid but unlisted token and asserts rejection.

**9. Swap bounds.** The adapter address is immutable. `minAmountOut` is required to be **non-zero** — `fundGrant` rejects `0` outright rather than defaulting it, because a zero floor makes the post-swap check vacuous. The swap carries a **transaction deadline** the caller must not set in the past, so a request left pending cannot settle against stale state. The USDG allowance is approved for exactly the input amount and reset to zero immediately after the swap returns, on the success path. Three tests cover this: zero `minStockOut` is rejected, a past deadline is rejected, and the adapter refuses an expired swap. The adapter test calls the adapter directly, because the escrow's own check makes the adapter's guard unreachable through `fundGrant` — a test that never reached the guard would prove nothing.

**10. `createGrant` records the caller as employer.** `msg.sender` is stored as `employer`, so an employer can only create their own grant. Only funded grants move value, so unfunded grant creation confers nothing and cannot be used to grief.

**11. No generic external-call helper.** There is no `execute(target, data)` and no arbitrary call primitive. Every external call targets USDG, the allowlisted stock token, or the swap adapter.

**12. `Math.mulDiv` does not apply.** The escrow performs no fixed-point conversion — the swap adapter owns conversion, and the escrow only measures a balance delta and transfers it back. There is no rounding in this contract to document, and claiming `mulDiv` compliance would point at code that does not exist. The rounding position lives in the adapter, which the mock implements at 1:1 with 18 decimals.

**13. `SafeERC20` throughout, and a failed swap cannot half-fund.** All token transfers use `SafeERC20`. `fundGrant` writes `selectedToken`, `rawEscrowAmount`, `fundingMultiplier`, and `status` only *after* the swap returns, so a reverting swap leaves the grant in `CREATED` with nothing escrowed. Checks-effects-interactions holds across the contract.

**14. No upgradeability.** The escrow is deployed as immutable logic with no proxy and no admin. Constructor arguments are immutable. There is no token-registry admin, and nothing has authority over an existing grant.

**15. The jurisdiction gate is labelled as a demo.** See the section below. It is stated in the UI on every screen it appears on, in the footer of gated pages, and here.

### Known limitations

Honest boundaries, not oversights:

- **The assets are mocks.** `MockUSDG` and the mock stock tokens are deployed by the demo script. They are not real securities and not real USDG.
- **The swap is not 0x.** See the note under "End-to-end mock demo". The adapter is an explicit boundary that a real router would implement; on testnet it is a deterministic mock.
- **The jurisdiction gate checks nothing.** It is a frontend placeholder.
- **No audit.** This code has had a focused static review and a test suite, not an external audit, and it should not hold real value.

## Robinhood Chain reserved prize slot

This project targets the **Robinhood Chain reserved prize slot** at Arbitrum Open House Singapore (Online Buildathon). It deploys to Robinhood Chain testnet, chain ID `46630`, and uses Robinhood Chain's stock-token concept — an allowlisted set of tokenised equities held in escrow — as the core of the product rather than as decoration. The escrow reads each stock token's `uiMultiplier()` at funding time, which exists because these are multiplier-bearing instruments, and the contract is explicitly built so that a later corporate action cannot change what a contractor is owed.

## USDG integration

USDG is the funding currency: the employer funds a bonus in USDG, and the contract swaps it into the chosen stock token at funding time, then holds only the stock.

`fundGrant` takes the USDG amount, transfers it from the employer, approves the swap adapter for exactly that amount, calls the adapter, and resets the allowance to zero. The escrow never holds USDG beyond the swap — after `fundGrant` returns, its USDG balance is zero and the grant is denominated entirely in the stock token. On testnet the USDG is `MockUSDG`, deployed by the demo script and minted to the deployer; there is no real USDG and no mainnet deployment.



## Scope of this scaffold

The frontend supports only the configured Robinhood Chain testnet mock contracts through an EIP-1193 wallet. It intentionally includes no production swap integration, mainnet deployment, real securities/token addresses, backend, or authentication.

Stated plainly, as the submission checklist asks: **jurisdiction and compliance are out of scope.** The gate in the frontend is a placeholder that verifies nothing, and this build makes no claim about who may legally receive tokenised equity in any jurisdiction.
