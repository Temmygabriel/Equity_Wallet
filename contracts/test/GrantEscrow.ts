import { expect } from "chai";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("GrantEscrow", function () {
  const USDG_AMOUNT = ethers.parseUnits("100", 18);
  const STOCK_AMOUNT = ethers.parseUnits("25", 18);
  const MULTIPLIER = 1_000_000n;

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

  async function fundAapl(fixture: Awaited<ReturnType<typeof deployFixture>>) {
    const { grantId, deadline } = await createGrant(fixture);
    await fixture.escrow
      .connect(fixture.employer)
      .fundGrant(grantId, USDG_AMOUNT, await fixture.aapl.getAddress(), STOCK_AMOUNT);
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
    await expect(fixture.escrow.connect(fixture.outsider).fundGrant(0, USDG_AMOUNT, await fixture.aapl.getAddress(), STOCK_AMOUNT))
      .to.be.revertedWith("GrantEscrow: only employer");
  });

  it("rejects stock tokens outside the explicit allowlist", async function () {
    const fixture = await deployFixture();
    await createGrant(fixture);
    await expect(fixture.escrow.connect(fixture.employer).fundGrant(0, USDG_AMOUNT, await fixture.unsupported.getAddress(), STOCK_AMOUNT))
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

  it("enforces minStockOut", async function () {
    const fixture = await deployFixture();
    await createGrant(fixture);
    await fixture.adapter.setOutputAmount(STOCK_AMOUNT - 1n);
    await expect(fixture.escrow.connect(fixture.employer).fundGrant(0, USDG_AMOUNT, await fixture.aapl.getAddress(), STOCK_AMOUNT))
      .to.be.revertedWith("MockSwapAdapter: insufficient output");
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

    expect(() => fixture.escrow.interface.getFunction("cancelGrant")).to.throw();
    expect(() => fixture.escrow.interface.getFunction("setGrantDeadline")).to.throw();
    await expect(fixture.escrow.connect(fixture.employer).fundGrant(grantId, USDG_AMOUNT, await fixture.tsla.getAddress(), STOCK_AMOUNT))
      .to.be.revertedWith("GrantEscrow: grant not created");

    const grantAfterFailedMutation = await fixture.escrow.grants(grantId);
    expect(grantAfterFailedMutation.deadline).to.equal(fundedGrant.deadline);
    expect(grantAfterFailedMutation.selectedToken).to.equal(fundedGrant.selectedToken);
  });

  it("blocks reentrancy during employer release while preserving the payout", async function () {
    const fixture = await deployFixture(true);
    const { deadline } = await createGrant(fixture);
    await fixture.escrow.connect(fixture.employer).fundGrant(0, USDG_AMOUNT, await fixture.aapl.getAddress(), STOCK_AMOUNT);
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
    await fixture.escrow.connect(fixture.employer).fundGrant(0, USDG_AMOUNT, await fixture.aapl.getAddress(), STOCK_AMOUNT);
    const payload = fixture.escrow.interface.encodeFunctionData("claimAfterTimeout", [0]);
    await fixture.aapl.configureReentry(await fixture.escrow.getAddress(), payload);
    await time.increaseTo(deadline);

    await fixture.escrow.connect(fixture.contractor).claimAfterTimeout(0);

    expect(await fixture.aapl.reentryAttempted()).to.equal(true);
    expect(await fixture.aapl.reentrySucceeded()).to.equal(false);
    expect(await fixture.aapl.balanceOf(fixture.contractor.address)).to.equal(STOCK_AMOUNT);
  });
});
