import { ethers } from "hardhat";

/**
 * Two-wallet end-to-end run against the deployed testnet demo.
 *
 * Build Spec day 8 asks for the whole loop tested with two separate wallets. The Hardhat
 * suite proves the contract in isolation; this proves the *deployed* contracts behave the
 * same way, with two distinct accounts, real transactions, and real confirmations.
 *
 * It exercises both payout paths:
 *   1. employer funds, then employer releases before the deadline
 *   2. employer funds, the deadline passes, contractor claims
 *
 * Read-only w.r.t. repository state: it deploys nothing and writes nothing to disk. It does
 * spend testnet ETH from both accounts for gas.
 */

const TESTNET_CHAIN_ID = 46630n;
const UI_MULTIPLIER = 1_000_000n;

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}. Set it in the environment before running the end-to-end test.`);
  return value;
}

function requiredAddress(name: string): string {
  const value = required(name);
  if (!ethers.isAddress(value) || value === ethers.ZeroAddress) {
    throw new Error(`Invalid address for ${name}.`);
  }
  return value;
}

const results: string[] = [];

function check(label: string, passed: boolean, detail: string) {
  results.push(`${passed ? "PASS" : "FAIL"}  ${label} — ${detail}`);
  if (!passed) process.exitCode = 1;
}

async function main() {
  const chainId = (await ethers.provider.getNetwork()).chainId;
  if (chainId !== TESTNET_CHAIN_ID) {
    throw new Error(`Refusing to run: expected chain ID ${TESTNET_CHAIN_ID}, received ${chainId}.`);
  }

  const escrowAddress = requiredAddress("GRANT_ESCROW_ADDRESS");
  const usdgAddress = requiredAddress("USDG_ADDRESS");
  const aaplAddress = requiredAddress("AAPL_ADDRESS");

  const employer = new ethers.Wallet(required("DEPLOYER_PRIVATE_KEY"), ethers.provider);
  const contractor = new ethers.Wallet(required("CONTRACTOR_PRIVATE_KEY"), ethers.provider);

  if (employer.address === contractor.address) {
    throw new Error("The two wallets are the same account, so this would not test anything.");
  }

  const escrow = await ethers.getContractAt("GrantEscrow", escrowAddress);
  const usdg = await ethers.getContractAt("MockUSDG", usdgAddress);
  const aapl = await ethers.getContractAt("MockStockToken", aaplAddress);

  console.log(`Employer:   ${employer.address}`);
  console.log(`Contractor: ${contractor.address}`);
  console.log(`GrantEscrow ${escrowAddress}`);

  const employerUsdg = await usdg.balanceOf(employer.address);
  console.log(`Employer USDG: ${ethers.formatUnits(employerUsdg, 18)}`);
  if (employerUsdg === 0n) throw new Error("The employer holds no mock USDG, so nothing can be funded.");

  /* ---------------------------------------------------------------- path 1: employer releases */

  const releaseAmount = ethers.parseUnits("10", 18);
  const releaseDeadline = BigInt(Math.floor(Date.now() / 1000) + 3600);

  const before1 = await escrow.grantCount();
  const stockBefore1 = await aapl.balanceOf(contractor.address);

  await (await usdg.connect(employer).approve(escrowAddress, releaseAmount)).wait();
  await (await escrow.connect(employer).createGrant(contractor.address, releaseDeadline)).wait();
  await (
    await escrow
      .connect(employer)
      .fundGrant(before1, releaseAmount, aaplAddress, releaseAmount, BigInt(Math.floor(Date.now() / 1000) + 1200))
  ).wait();

  const funded1 = await escrow.grants(before1);
  check("fund records the contractor", funded1.contractor === contractor.address, funded1.contractor);
  check("fund stores the multiplier once", funded1.fundingMultiplier === UI_MULTIPLIER, funded1.fundingMultiplier.toString());
  check("fund escrows the raw amount", funded1.rawEscrowAmount === releaseAmount, funded1.rawEscrowAmount.toString());

  const escrowUsdgAfterFund = await usdg.balanceOf(escrowAddress);
  check("escrow holds no USDG after funding", escrowUsdgAfterFund === 0n, escrowUsdgAfterFund.toString());

  await (await escrow.connect(employer).releaseGrant(before1)).wait();

  const stockAfter1 = await aapl.balanceOf(contractor.address);
  const released1 = await escrow.grants(before1);
  check("employer release pays the contractor", stockAfter1 - stockBefore1 === releaseAmount, `+${(stockAfter1 - stockBefore1).toString()} raw`);
  check("release sets status RELEASED", released1.status === 2n, released1.status.toString());

  /* ------------------------------------------------------------- path 2: contractor claims */

  const claimAmount = ethers.parseUnits("5", 18);
  /* Short deadline so the timeout path is reachable inside one run. */
  const claimDeadline = BigInt(Math.floor(Date.now() / 1000) + 75);

  const before2 = await escrow.grantCount();
  const stockBefore2 = await aapl.balanceOf(contractor.address);

  await (await usdg.connect(employer).approve(escrowAddress, claimAmount)).wait();
  await (await escrow.connect(employer).createGrant(contractor.address, claimDeadline)).wait();
  await (
    await escrow
      .connect(employer)
      .fundGrant(before2, claimAmount, aaplAddress, claimAmount, BigInt(Math.floor(Date.now() / 1000) + 1200))
  ).wait();

  /* The employer must not be able to release once the deadline has passed. */
  const waitMs = Number(claimDeadline) * 1000 - Date.now() + 6000;
  console.log(`Waiting ${Math.ceil(waitMs / 1000)}s for the deadline to pass…`);
  await new Promise((resolve) => setTimeout(resolve, Math.max(waitMs, 0)));

  let employerReleaseRefused = false;
  try {
    await (await escrow.connect(employer).releaseGrant(before2)).wait();
  } catch {
    employerReleaseRefused = true;
  }
  check("employer cannot release after the deadline", employerReleaseRefused, employerReleaseRefused ? "reverted" : "SUCCEEDED, which is wrong");

  await (await escrow.connect(contractor).claimAfterTimeout(before2)).wait();

  const stockAfter2 = await aapl.balanceOf(contractor.address);
  const released2 = await escrow.grants(before2);
  check("timeout claim pays the contractor", stockAfter2 - stockBefore2 === claimAmount, `+${(stockAfter2 - stockBefore2).toString()} raw`);
  check("claim sets status RELEASED", released2.status === 2n, released2.status.toString());

  /* A released grant must not be releasable or claimable a second time. */
  let secondClaimRefused = false;
  try {
    await (await escrow.connect(contractor).claimAfterTimeout(before2)).wait();
  } catch {
    secondClaimRefused = true;
  }
  check("a released grant cannot be claimed twice", secondClaimRefused, secondClaimRefused ? "reverted" : "SUCCEEDED, which is wrong");

  console.log("\n--- results ---");
  for (const line of results) console.log(line);
  const failed = results.filter((line) => line.startsWith("FAIL")).length;
  console.log(`\n${results.length - failed}/${results.length} checks passed.`);
  if (failed > 0) process.exitCode = 1;
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
