/**
 * UI boundary for future viem/wagmi reads and writes. This demo deliberately
 * returns local fixture data and never connects a wallet or sends a transaction.
 */
export type GrantState = "LOCKED" | "UNLOCKED" | "CLAIMED";

export type DemoGrant = {
  id: string;
  contractor: string;
  stock: "AAPL" | "TSLA" | "NVDA";
  stockAmount: string;
  usdgAmount: string;
  milestone: string;
  deadline: string;
  state: GrantState;
};

export const demoGrant: DemoGrant = {
  id: "GRANT-0042",
  contractor: "0x7a31…4C8e",
  stock: "AAPL",
  stockAmount: "12.50",
  usdgAmount: "1,250",
  milestone: "Ship the Robinhood Chain testnet integration",
  deadline: "15 October 2026",
  state: "LOCKED"
};

export interface EquityWalletAdapter {
  getGrant(): Promise<DemoGrant>;
  fundGrant(): Promise<void>;
  releaseGrant(): Promise<void>;
  claimAfterTimeout(): Promise<void>;
}

export const demoAdapter: EquityWalletAdapter = {
  getGrant: async () => demoGrant,
  fundGrant: async () => undefined,
  releaseGrant: async () => undefined,
  claimAfterTimeout: async () => undefined
};
