import { ethers } from "hardhat";

const TESTNET_CHAIN_ID = 46630n;
const INITIAL_USDG = ethers.parseUnits("100000", 18);
const UI_MULTIPLIER = 1_000_000n;

async function main() {
  const chainId = (await ethers.provider.getNetwork()).chainId;
  if (chainId !== TESTNET_CHAIN_ID) {
    throw new Error(`Refusing demo deployment: expected chain ID ${TESTNET_CHAIN_ID}, received ${chainId}.`);
  }

  const [deployer] = await ethers.getSigners();
  const usdg = await ethers.deployContract("MockUSDG");
  const aapl = await ethers.deployContract("MockStockToken", ["Test Apple Stock", "AAPL", UI_MULTIPLIER]);
  const tsla = await ethers.deployContract("MockStockToken", ["Test Tesla Stock", "TSLA", UI_MULTIPLIER]);
  const nvda = await ethers.deployContract("MockStockToken", ["Test Nvidia Stock", "NVDA", UI_MULTIPLIER]);
  const swapAdapter = await ethers.deployContract("MockSwapAdapter");

  await Promise.all([usdg.waitForDeployment(), aapl.waitForDeployment(), tsla.waitForDeployment(), nvda.waitForDeployment(), swapAdapter.waitForDeployment()]);

  const grantEscrow = await ethers.deployContract("GrantEscrow", [
    await usdg.getAddress(),
    await swapAdapter.getAddress(),
    await aapl.getAddress(),
    await tsla.getAddress(),
    await nvda.getAddress()
  ]);
  await grantEscrow.waitForDeployment();
  await usdg.mint(deployer.address, INITIAL_USDG);

  console.log(`Robinhood Chain Testnet demo deployed (chain ID ${chainId})`);
  console.log(`Deployer: ${deployer.address}`);
  console.log(`MockUSDG: ${await usdg.getAddress()}`);
  console.log(`Mock AAPL: ${await aapl.getAddress()}`);
  console.log(`Mock TSLA: ${await tsla.getAddress()}`);
  console.log(`Mock NVDA: ${await nvda.getAddress()}`);
  console.log(`MockSwapAdapter: ${await swapAdapter.getAddress()}`);
  console.log(`GrantEscrow: ${await grantEscrow.getAddress()}`);
  console.log("Copy these values to frontend/.env.local:");
  console.log(`VITE_GRANT_ESCROW_ADDRESS=${await grantEscrow.getAddress()}`);
  console.log(`VITE_USDG_ADDRESS=${await usdg.getAddress()}`);
  console.log(`VITE_AAPL_ADDRESS=${await aapl.getAddress()}`);
  console.log(`VITE_TSLA_ADDRESS=${await tsla.getAddress()}`);
  console.log(`VITE_NVDA_ADDRESS=${await nvda.getAddress()}`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
