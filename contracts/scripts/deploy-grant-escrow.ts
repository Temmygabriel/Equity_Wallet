import * as dotenv from "dotenv";
import { ethers } from "hardhat";

dotenv.config({ path: "../.env" });

const addressVariables = ["USDG", "SWAP_ADAPTER", "AAPL", "TSLA", "NVDA"] as const;
type AddressVariable = (typeof addressVariables)[number];

function requiredAddress(variable: AddressVariable): string {
  const value = process.env[variable];
  if (!value) {
    throw new Error(`Missing required deployment address: ${variable}. Set it in .env before deploying.`);
  }
  if (!ethers.isAddress(value) || value === ethers.ZeroAddress) {
    throw new Error(`Invalid deployment address for ${variable}: expected a non-zero EVM address.`);
  }
  return value;
}

async function main() {
  const [usdg, swapAdapter, aapl, tsla, nvda] = addressVariables.map(requiredAddress);
  const GrantEscrow = await ethers.getContractFactory("GrantEscrow");
  const grantEscrow = await GrantEscrow.deploy(usdg, swapAdapter, aapl, tsla, nvda);
  await grantEscrow.waitForDeployment();

  console.log("GrantEscrow deployed to:", await grantEscrow.getAddress());
  console.log("Record this address in PROGRESS.md after explorer verification.");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
