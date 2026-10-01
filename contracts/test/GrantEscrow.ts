import { expect } from "chai";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("GrantEscrow", function () {
  const USDG_AMOUNT = ethers.parseUnits("100", 18);
  const STOCK_AMOUNT = ethers.parseUnits("25", 18);
  const MULTIPLIER = 1_000_000n;
  const MILESTONE = "Shipping the Robinhood Chain integration";

  async function deployFixture(reentrantAapl = false) {
    const [employer, contractor, outsider] = await ethers.getSigners();
    const usdg = await ethers.deployContract("MockUSDG");
    const adapter = await ethers.deployContract("MockSwapAdapter");
    const aapl = reentrantAapl
      ? await ethers.deployContract("ReentrantStockToken", [MULTIPLIER])
      : await ethers.deployContract("MockStockToken", ["Apple", "AAPL", MULTIPLIER]);
    const tsla = await ethers.deployContract("MockStockToken", ["Tesla", "TSLA", MULTIPLIER]);
    const nvda = await ethers.deployContract("MockStockToken", ["Nvidia", "NVDA", MULTIPLIER]);
    const unsupported = await ethers.deployContract("MockStockToken", ["Unsupported", "NOPE", MULTIPLIER]);
    const escrow = await ethers.deployContract("GrantEscrow", [
      await usdg.getAddress(),
      await adapter.getAddress(),
      await aapl.getAddress(),
      await tsla.getAddress(),
      await nvda.getAddress()
    ]);

    await usdg.mint(employer.address, USDG_AMOUNT * 10n);
    await usdg.connect(employer).approve(await escrow.getAddress(), ethers.MaxUint256);
    await adapter.setOutputAmount(STOCK_AMOUNT);
    return { employer, contractor, outsider, usdg, adapter, aapl, tsla, nvda, unsupported, escrow };
  }

  async function createGrant(fixture: Awaited<ReturnType<typeof deployFixture>>, deadline?: bigint) {
    const actualDeadline = deadline ?? BigInt(await time.latest()) + 3600n;
    await fixture.escrow.connect(fixture.employer).createGrant(fixture.contractor.address, actualDeadline);
    return { grantId: 0n, deadline: actualDeadline };
  }

  /* Rule 9 requires the swap to carry a transaction deadline. The escrow takes it from the
     caller, so tests pass a real future timestamp rather than a placeholder. */
  async function swapDeadline() {
    return BigInt(await time.latest()) + 600n;
  }

  async function fundAapl(fixture: Awaited<ReturnType<typeof deployFixture>>) {
    const { grantId, deadline } = await createGrant(fixture);
    await fixture.escrow
      .connect(fixture.employer)
      .fundGrant(grantId, USDG_AMOUNT, await fixture.aapl.getAddress(), STOCK_AMOUNT, await swapDeadline(), MILESTONE);
    return { grantId, deadline };
  }

  it("creates a grant with the caller as employer", async function () {
    const fixture = await deployFixture();
    const { deadline } = await createGrant(fixture);
    const grant = await fixture.escrow.grants(0);

    expect(grant.employer).to.equal(fixture.employer.address);
    expect(grant.contractor).to.equal(fixture.contractor.address);
    expect(grant.deadline).to.equal(deadline);
    expect(grant.status).to.equal(0);
  });

  it("rejects an invalid contractor or deadline", async function () {
    const fixture = await deployFixture();
    await expect(fixture.escrow.createGrant(ethers.ZeroAddress, BigInt(await time.latest()) + 1n))
      .to.be.revertedWith("GrantEscrow: invalid contractor");
    await expect(fixture.escrow.createGrant(fixture.contractor.address, BigInt(await time.latest())))
      .to.be.revertedWith("GrantEscrow: invalid deadline");
  });

  it("allows only the employer to fund", async function () {
    const fixture = await deployFixture();
    await createGrant(fixture);
    await expect(fixture.escrow.connect(fixture.outsider).fundGrant(0, USDG_AMOUNT, await fixture.aapl.getAddress(), STOCK_AMOUNT, await swapDeadline(), MILESTONE))
      .to.be.revertedWith("GrantEscrow: only employer");
  });

  it("rejects stock tokens outside the explicit allowlist", async function () {
    const fixture = await deployFixture();
    await createGrant(fixture);
    await expect(fixture.escrow.connect(fixture.employer).fundGrant(0, USDG_AMOUNT, await fixture.unsupported.getAddress(), STOCK_AMOUNT, await swapDeadline(), MILESTONE))
      .to.be.revertedWith("GrantEscrow: unsupported stock token");
  });

  it("funds with the exact received raw stock amount and stores the multiplier once", async function () {
    const fixture = await deployFixture();
    const { grantId } = await fundAapl(fixture);
    const grant = await fixture.escrow.grants(grantId);

    expect(grant.status).to.equal(1);
    expect(grant.selectedToken).to.equal(await fixture.aapl.getAddress());
    expect(grant.rawEscrowAmount).to.equal(STOCK_AMOUNT);
    expect(grant.fundingMultiplier).to.equal(MULTIPLIER);
    expect(await fixture.usdg.allowance(await fixture.escrow.getAddress(), await fixture.adapter.getAddress())).to.equal(0);
  });

  /* The agreement must survive leaving the browser that created it, so both halves of it
     are written to storage at funding rather than kept alongside the session. */
  it("stores the funded USDG amount on chain", async function () {
    const fixture = await deployFixture();
    const { grantId } = await fundAapl(fixture);

    expect((await fixture.escrow.grants(grantId)).fundedUsdgAmount).to.equal(USDG_AMOUNT);
  });

  it("stores the milestone on chain", async function () {
    const fixture = await deployFixture();
    const { grantId } = await fundAapl(fixture);

    expect((await fixture.escrow.grants(grantId)).milestone).to.equal(MILESTONE);
  });

  it("rejects an empty milestone", async function () {
    const fixture = await deployFixture();
    await createGrant(fixture);
    await expect(
      fixture.escrow.connect(fixture.employer).fundGrant(0, USDG_AMOUNT, await fixture.aapl.getAddress(), STOCK_AMOUNT, await swapDeadline(), "")
    ).to.be.revertedWith("GrantEscrow: empty milestone");
  });

  it("rejects a milestone above the maximum length", async function () {
    const fixture = await deployFixture();
    await createGrant(fixture);
    const tooLong = "x".repeat(281);
    await expect(
      fixture.escrow.connect(fixture.employer).fundGrant(0, USDG_AMOUNT, await fixture.aapl.getAddress(), STOCK_AMOUNT, await swapDeadline(), tooLong)
    ).to.be.revertedWith("GrantEscrow: milestone too long");
  });

  it("accepts a milestone exactly at the maximum length", async function () {
    const fixture = await deployFixture();
    await createGrant(fixture);
    const atLimit = "x".repeat(280);

    await fixture.escrow.connect(fixture.employer).fundGrant(0, USDG_AMOUNT, await fixture.aapl.getAddress(), STOCK_AMOUNT, await swapDeadline(), atLimit);

    expect((await fixture.escrow.grants(0)).milestone).to.equal(atLimit);
  });

  /* Immutability is structural, not a guarded setter: there is no function that writes these
     fields once the status has left CREATED, and funding cannot run twice. */
  it("does not let a funded milestone or funded amount be modified", async function () {
    const fixture = await deployFixture();
    const { grantId } = await fundAapl(fixture);
    const funded = await fixture.escrow.grants(grantId);

    await expect(
      fixture.escrow.connect(fixture.employer).fundGrant(grantId, USDG_AMOUNT, await fixture.tsla.getAddress(), STOCK_AMOUNT, await swapDeadline(), "Something else entirely")
    ).to.be.revertedWith("GrantEscrow: grant not created");

    const after = await fixture.escrow.grants(grantId);
    expect(after.milestone).to.equal(funded.milestone);
    expect(after.fundedUsdgAmount).to.equal(funded.fundedUsdgAmount);
    expect(after.selectedToken).to.equal(funded.selectedToken);
    expect(after.rawEscrowAmount).to.equal(funded.rawEscrowAmount);
  });

  /* The portability property the product promises: a reader that has never held the
     employer's browser state still recovers the whole agreement. The test holds no local
     state at all — every field below comes from one contract read. */
  it("recovers the milestone from chain data alone", async function () {
    const fixture = await deployFixture();
    const { grantId } = await fundAapl(fixture);

    const [employer, contractor, selectedToken, , , , , milestone, status] = await fixture.escrow.grants(grantId);

    expect(employer).to.equal(fixture.employer.address);
    expect(contractor).to.equal(fixture.contractor.address);
    expect(selectedToken).to.equal(await fixture.aapl.getAddress());
    expect(milestone).to.equal(MILESTONE);
    expect(status).to.equal(1);
  });

  it("recovers the funded USDG amount from chain data alone", async function () {
    const fixture = await deployFixture();
    const { grantId } = await fundAapl(fixture);

    const [, , , rawEscrowAmount, fundedUsdgAmount] = await fixture.escrow.grants(grantId);

    expect(fundedUsdgAmount).to.equal(USDG_AMOUNT);
    expect(rawEscrowAmount).to.equal(STOCK_AMOUNT);
  });

  /* The employer's list is discovered from this event, so it has to carry the whole
     agreement and both addresses have to be indexed for the filter to work. */
  it("emits a GrantFunded event that carries the whole agreement", async function () {
    const fixture = await deployFixture();
    const { grantId } = await fundAapl(fixture);

    const events = await fixture.escrow.queryFilter(fixture.escrow.filters.GrantFunded(grantId));
    expect(events).to.have.length(1);
    const event = events[0] as typeof events[number] & { args: Record<string, unknown> };
    expect(event.args.selectedToken).to.equal(await fixture.aapl.getAddress());
    expect(event.args.rawEscrowAmount).to.equal(STOCK_AMOUNT);
    expect(event.args.fundingMultiplier).to.equal(MULTIPLIER);
    expect(event.args.fundedUsdgAmount).to.equal(USDG_AMOUNT);
    expect(event.args.milestone).to.equal(MILESTONE);
  });

  it("filters GrantCreated by indexed employer", async function () {
    const fixture = await deployFixture();
    await createGrant(fixture);

    const mine = await fixture.escrow.queryFilter(fixture.escrow.filters.GrantCreated(null, fixture.employer.address));
    const theirs = await fixture.escrow.queryFilter(fixture.escrow.filters.GrantCreated(null, fixture.outsider.address));

    expect(mine).to.have.length(1);
    expect(theirs).to.have.length(0);
  });

  it("enforces minStockOut", async function () {
    const fixture = await deployFixture();
    await createGrant(fixture);
    await fixture.adapter.setOutputAmount(STOCK_AMOUNT - 1n);
    await expect(fixture.escrow.connect(fixture.employer).fundGrant(0, USDG_AMOUNT, await fixture.aapl.getAddress(), STOCK_AMOUNT, await swapDeadline(), MILESTONE))
      .to.be.revertedWith("MockSwapAdapter: insufficient output");
  });

  /* Build Spec §4 rule 9. A zero floor passes `rawEscrowAmount >= minStockOut` for any output,
     so it must be rejected before the swap rather than silently accepted. */
  it("rejects a zero minStockOut", async function () {
    const fixture = await deployFixture();
    await createGrant(fixture);
    await expect(fixture.escrow.connect(fixture.employer).fundGrant(0, USDG_AMOUNT, await fixture.aapl.getAddress(), 0n, await swapDeadline(), MILESTONE))
      .to.be.revertedWith("GrantEscrow: zero minStockOut");
  });

  it("rejects a swap deadline that has already passed", async function () {
    const fixture = await deployFixture();
    await createGrant(fixture);
    await expect(fixture.escrow.connect(fixture.employer).fundGrant(0, USDG_AMOUNT, await fixture.aapl.getAddress(), STOCK_AMOUNT, BigInt(await time.latest()) - 1n, MILESTONE))
      .to.be.revertedWith("GrantEscrow: swap deadline passed");
  });

  /* The escrow's own check makes the adapter's guard unreachable through fundGrant, so this
     exercises the adapter directly — otherwise the deadline plumbing would be asserted only
     at the call site and never at the boundary that is supposed to honour it. */
  it("stops the adapter executing a swap past its deadline", async function () {
    const fixture = await deployFixture();
    const deadline = await swapDeadline();
    await fixture.usdg.connect(fixture.employer).approve(await fixture.adapter.getAddress(), USDG_AMOUNT);
    await time.increaseTo(deadline + 1n);

    await expect(
      fixture.adapter.connect(fixture.employer).swap(await fixture.usdg.getAddress(), await fixture.aapl.getAddress(), USDG_AMOUNT, STOCK_AMOUNT, deadline)
    ).to.be.revertedWith("MockSwapAdapter: swap expired");
  });

  it("uses the mock adapter's deterministic configured rate", async function () {
    const fixture = await deployFixture();
    await createGrant(fixture);
    await fixture.adapter.setRate(ethers.parseUnits("1", 18));

    await fixture.escrow.connect(fixture.employer).fundGrant(0, USDG_AMOUNT, await fixture.aapl.getAddress(), USDG_AMOUNT, await swapDeadline(), MILESTONE);

    expect((await fixture.escrow.grants(0)).rawEscrowAmount).to.equal(USDG_AMOUNT);
  });

  it("lets the employer release before the deadline and pays the stored raw amount", async function () {
    const fixture = await deployFixture();
    const { grantId } = await fundAapl(fixture);
    const before = await fixture.aapl.balanceOf(fixture.contractor.address);

    await fixture.escrow.connect(fixture.employer).releaseGrant(grantId);

    expect(await fixture.aapl.balanceOf(fixture.contractor.address)).to.equal(before + STOCK_AMOUNT);
    expect((await fixture.escrow.grants(grantId)).status).to.equal(2);
  });

  it("allows only the employer to release", async function () {
    const fixture = await deployFixture();
    const { grantId } = await fundAapl(fixture);
    await expect(fixture.escrow.connect(fixture.outsider).releaseGrant(grantId))
      .to.be.revertedWith("GrantEscrow: only employer");
  });

  it("rejects employer release at or after the deadline", async function () {
    const fixture = await deployFixture();
    const { grantId, deadline } = await fundAapl(fixture);
    await time.increaseTo(deadline);
    await expect(fixture.escrow.connect(fixture.employer).releaseGrant(grantId))
      .to.be.revertedWith("GrantEscrow: deadline passed");
  });

  it("does not allow the contractor to claim before the deadline", async function () {
    const fixture = await deployFixture();
    const { grantId } = await fundAapl(fixture);
    await expect(fixture.escrow.connect(fixture.contractor).claimAfterTimeout(grantId))
      .to.be.revertedWith("GrantEscrow: deadline not reached");
  });

  it("allows the contractor to claim at the exact deadline and pays the stored raw amount", async function () {
    const fixture = await deployFixture();
    const { grantId, deadline } = await fundAapl(fixture);
    const before = await fixture.aapl.balanceOf(fixture.contractor.address);
    await time.increaseTo(deadline);

    await fixture.escrow.connect(fixture.contractor).claimAfterTimeout(grantId);

    expect(await fixture.aapl.balanceOf(fixture.contractor.address)).to.equal(before + STOCK_AMOUNT);
    expect((await fixture.escrow.grants(grantId)).status).to.equal(2);
  });

  it("rejects timeout claims from callers other than the stored contractor", async function () {
    const fixture = await deployFixture();
    const { grantId, deadline } = await fundAapl(fixture);
    await time.increaseTo(deadline);
    await expect(fixture.escrow.connect(fixture.outsider).claimAfterTimeout(grantId))
      .to.be.revertedWith("GrantEscrow: only contractor");
  });

  it("does not recompute payout after the multiplier changes", async function () {
    const fixture = await deployFixture();
    const { grantId } = await fundAapl(fixture);
    await fixture.aapl.setUiMultiplier(MULTIPLIER * 99n);

    await fixture.escrow.connect(fixture.employer).releaseGrant(grantId);

    expect(await fixture.aapl.balanceOf(fixture.contractor.address)).to.equal(STOCK_AMOUNT);
    expect((await fixture.escrow.grants(grantId)).fundingMultiplier).to.equal(MULTIPLIER);
  });

  it("has no cancellation or grant mutation path after funding", async function () {
    const fixture = await deployFixture();
    const { grantId } = await fundAapl(fixture);
    const fundedGrant = await fixture.escrow.grants(grantId);

    // Assert against the ABI surface directly. ethers v6 returns null from
    // interface.getFunction() for an unknown name instead of throwing, so the
    // previous .to.throw() form could never pass even though the invariant held.
    const functionNames = fixture.escrow.interface.fragments
      .filter((fragment) => fragment.type === "function")
      .map((fragment) => (fragment as { name: string }).name);
    expect(functionNames).to.not.include("cancelGrant");
    expect(functionNames).to.not.include("setGrantDeadline");
    await expect(fixture.escrow.connect(fixture.employer).fundGrant(grantId, USDG_AMOUNT, await fixture.tsla.getAddress(), STOCK_AMOUNT, await swapDeadline(), MILESTONE))
      .to.be.revertedWith("GrantEscrow: grant not created");

    const grantAfterFailedMutation = await fixture.escrow.grants(grantId);
    expect(grantAfterFailedMutation.deadline).to.equal(fundedGrant.deadline);
    expect(grantAfterFailedMutation.selectedToken).to.equal(fundedGrant.selectedToken);
  });

  it("blocks reentrancy during employer release while preserving the payout", async function () {
    const fixture = await deployFixture(true);
    const { deadline } = await createGrant(fixture);
    await fixture.escrow.connect(fixture.employer).fundGrant(0, USDG_AMOUNT, await fixture.aapl.getAddress(), STOCK_AMOUNT, await swapDeadline(), MILESTONE);
    const payload = fixture.escrow.interface.encodeFunctionData("releaseGrant", [0]);
    await fixture.aapl.configureReentry(await fixture.escrow.getAddress(), payload);

    await fixture.escrow.connect(fixture.employer).releaseGrant(0);

    expect(await fixture.aapl.reentryAttempted()).to.equal(true);
    expect(await fixture.aapl.reentrySucceeded()).to.equal(false);
    expect(await fixture.aapl.balanceOf(fixture.contractor.address)).to.equal(STOCK_AMOUNT);
    expect((await fixture.escrow.grants(0)).deadline).to.equal(deadline);
  });

  it("blocks reentrancy during timeout claim while preserving the contractor payout", async function () {
    const fixture = await deployFixture(true);
    const { deadline } = await createGrant(fixture);
    await fixture.escrow.connect(fixture.employer).fundGrant(0, USDG_AMOUNT, await fixture.aapl.getAddress(), STOCK_AMOUNT, await swapDeadline(), MILESTONE);
    const payload = fixture.escrow.interface.encodeFunctionData("claimAfterTimeout", [0]);
    await fixture.aapl.configureReentry(await fixture.escrow.getAddress(), payload);
    await time.increaseTo(deadline);

    await fixture.escrow.connect(fixture.contractor).claimAfterTimeout(0);

    expect(await fixture.aapl.reentryAttempted()).to.equal(true);
    expect(await fixture.aapl.reentrySucceeded()).to.equal(false);
    expect(await fixture.aapl.balanceOf(fixture.contractor.address)).to.equal(STOCK_AMOUNT);
  });
});
