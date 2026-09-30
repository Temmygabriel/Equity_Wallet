import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";
import type { HardhatUserConfig } from "hardhat/config";

dotenv.config({ path: "../.env" });

const robinhoodTestnetRpcUrl = process.env.RH_RPC_URL ?? "https://rpc.testnet.chain.robinhood.com";
const deployerPrivateKey = process.env.DEPLOYER_PRIVATE_KEY;

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: { enabled: true, runs: 200 }
    }
  },
  networks: {
    robinhoodTestnet: {
      chainId: 46630,
      url: robinhoodTestnetRpcUrl,
      accounts: deployerPrivateKey ? [deployerPrivateKey] : []
    }
  },
  /* The Robinhood Chain testnet explorer answers the Etherscan-compatible API
     (`module=contract&action=verifysourcecode`), so hardhat-verify can drive it.
     Blockscout accepts any non-empty key, so this is a placeholder rather than a
     secret; set EXPLORER_API_KEY only if the explorer ever starts enforcing one. */
  etherscan: {
    apiKey: { robinhoodTestnet: process.env.EXPLORER_API_KEY ?? "blockscout" },
    customChains: [
      {
        network: "robinhoodTestnet",
        chainId: 46630,
        urls: {
          apiURL: "https://explorer.testnet.chain.robinhood.com/api",
          browserURL: "https://explorer.testnet.chain.robinhood.com"
        }
      }
    ]
  }
};

export default config;
