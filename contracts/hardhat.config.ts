import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";
import type { HardhatUserConfig } from "hardhat/config";

dotenv.config({ path: "../.env" });

const rpcUrl = process.env.ROBINHOOD_TESTNET_RPC_URL;
const deployerPrivateKey = process.env.DEPLOYER_PRIVATE_KEY;

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: { enabled: true, runs: 200 }
    }
  },
  networks: rpcUrl
    ? {
        robinhoodTestnet: {
          chainId: 46630,
          url: rpcUrl,
          accounts: deployerPrivateKey ? [deployerPrivateKey] : []
        }
      }
    : {}
};

export default config;
