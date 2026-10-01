import {
  createPublicClient,
  createWalletClient,
  custom,
  formatUnits,
  http,
  parseEventLogs,
  parseUnits,
  type Address,
  type EIP1193Provider,
  type Log
} from "viem";

export const ROBINHOOD_TESTNET_CHAIN_ID = 46630;
const rpcUrl = import.meta.env.VITE_RH_RPC_URL ?? "https://rpc.testnet.chain.robinhood.com";
const EXPLORER_BASE = "https://explorer.testnet.chain.robinhood.com";

const robinhoodTestnet = {
  id: ROBINHOOD_TESTNET_CHAIN_ID,
  name: "Robinhood Chain Testnet",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: [rpcUrl] } }
} as const;

const grantEscrowAbi = [
  { type: "function", name: "createGrant", stateMutability: "nonpayable", inputs: [{ name: "contractor", type: "address" }, { name: "deadline", type: "uint256" }], outputs: [{ name: "grantId", type: "uint256" }] },
  { type: "function", name: "fundGrant", stateMutability: "nonpayable", inputs: [{ name: "grantId", type: "uint256" }, { name: "usdgAmount", type: "uint256" }, { name: "selectedToken", type: "address" }, { name: "minStockOut", type: "uint256" }, { name: "swapDeadline", type: "uint256" }, { name: "milestone", type: "string" }], outputs: [] },
  { type: "function", name: "releaseGrant", stateMutability: "nonpayable", inputs: [{ name: "grantId", type: "uint256" }], outputs: [] },
  { type: "function", name: "claimAfterTimeout", stateMutability: "nonpayable", inputs: [{ name: "grantId", type: "uint256" }], outputs: [] },
  /* Field order must match the Solidity struct exactly. It carries the milestone and the
     funded USDG amount, so one read recovers the whole agreement on a machine that has
     never held the employer's browser state. */
  { type: "function", name: "grants", stateMutability: "view", inputs: [{ name: "grantId", type: "uint256" }], outputs: [{ name: "employer", type: "address" }, { name: "contractor", type: "address" }, { name: "selectedToken", type: "address" }, { name: "rawEscrowAmount", type: "uint256" }, { name: "fundedUsdgAmount", type: "uint256" }, { name: "fundingMultiplier", type: "uint256" }, { name: "deadline", type: "uint256" }, { name: "milestone", type: "string" }, { name: "status", type: "uint8" }] },
  /* `employer` is indexed so the employer's list can be discovered by filtering logs. This
     is what replaces the browser's own register of what it had funded. */
  { type: "event", name: "GrantCreated", inputs: [{ name: "grantId", type: "uint256", indexed: true }, { name: "employer", type: "address", indexed: true }, { name: "contractor", type: "address", indexed: true }, { name: "deadline", type: "uint256", indexed: false }] },
  /* Both release paths set the same RELEASED status, so the status alone cannot
     say which one ran. The timeoutClaim flag on this event can (spec §11.4). */
  { type: "event", name: "GrantReleased", inputs: [{ name: "grantId", type: "uint256", indexed: true }, { name: "contractor", type: "address", indexed: true }, { name: "rawEscrowAmount", type: "uint256", indexed: false }, { name: "timeoutClaim", type: "bool", indexed: false }] }
] as const;

const erc20Abi = [
  { type: "function", name: "approve", stateMutability: "nonpayable", inputs: [{ name: "spender", type: "address" }, { name: "amount", type: "uint256" }], outputs: [{ name: "", type: "bool" }] }
] as const;

type Config = { grantEscrow: Address; usdg: Address; stocks: Record<"AAPL" | "TSLA" | "NVDA", Address> };
export type GrantState = "LOCKED" | "UNLOCKED" | "CLAIMED";
/* employerAddress, contractorAddress and releasedBy are additive read-only
   fields (spec §10.3, and §11.4 for releasedBy). No existing field was renamed
   or removed, so every existing caller keeps working.

   usdgAmount and milestone now come from the contract. They used to be read out
   of the funding browser's localStorage, which meant a contractor opening the
   link elsewhere saw a bonus with no amount and no description. */
export type DemoGrant = { id: string; contractor: string; employerAddress?: string; contractorAddress?: string; releasedBy?: "employer" | "timeout"; stock: "AAPL" | "TSLA" | "NVDA"; stockAmount: string; usdgAmount: string; milestone: string; deadline: string; deadlineTimestamp: number; state: GrantState };
export type FundGrantInput = { contractor: Address; deadline: Date; stock: "AAPL" | "TSLA" | "NVDA"; usdgAmount: string; milestone: string; minStockOut?: string };

declare global { interface Window { ethereum?: EIP1193Provider } }

function requiredAddress(name: string): Address {
  const value = import.meta.env[name] as string | undefined;
  if (!value || !/^0x[a-fA-F0-9]{40}$/.test(value)) throw new Error(`Missing or invalid ${name}. Deploy the demo contracts, then set it in the deployment environment (Vercel) or in frontend/.env.local.`);
  return value as Address;
}

function config(): Config {
  return { grantEscrow: requiredAddress("VITE_GRANT_ESCROW_ADDRESS"), usdg: requiredAddress("VITE_USDG_ADDRESS"), stocks: { AAPL: requiredAddress("VITE_AAPL_ADDRESS"), TSLA: requiredAddress("VITE_TSLA_ADDRESS"), NVDA: requiredAddress("VITE_NVDA_ADDRESS") } };
}

function provider(): EIP1193Provider {
  if (!window.ethereum) throw new Error("No EIP-1193 wallet found. Install or unlock a browser wallet.");
  return window.ethereum;
}

/* The escrow's page on the explorer. A grant is an entry in the contract's mapping rather
   than its own address, so the contract is the honest target for "view onchain". This is
   evidence for the certificate, not a product surface, so callers keep it quiet. */
export function explorerContractUrl(): string {
  return `${EXPLORER_BASE}/address/${config().grantEscrow}`;
}

/* The judge's certificate is opened by number, so the link is built from configuration
   rather than from any browser state. Returns undefined when unset, so the landing page can
   simply not offer the link instead of rendering a broken one. */
export function judgeGrantId(): string | undefined {
  const value = import.meta.env.VITE_JUDGE_GRANT_ID as string | undefined;
  return value && /^\d+$/.test(value) ? value : undefined;
}

async function wallet() {
  const eip1193 = provider();
  const chainId = await eip1193.request({ method: "eth_chainId" });
  if (Number.parseInt(chainId as string, 16) !== ROBINHOOD_TESTNET_CHAIN_ID) throw new Error("Switch your wallet to Robinhood Chain Testnet (46630).");
  const [account] = await eip1193.request({ method: "eth_requestAccounts" }) as Address[];
  if (!account) throw new Error("Wallet did not return an account.");
  return { account, client: createWalletClient({ account, chain: robinhoodTestnet, transport: custom(eip1193) }) };
}

const publicClient = createPublicClient({ chain: robinhoodTestnet, transport: http(rpcUrl) });
const stockByAddress = (addresses: Config["stocks"], address: Address): "AAPL" | "TSLA" | "NVDA" => Object.entries(addresses).find(([, value]) => value.toLowerCase() === address.toLowerCase())?.[0] as "AAPL" | "TSLA" | "NVDA";

/* The newly created grant's number comes from decoding the GrantCreated event, not from the
   receipt's first log. `logs[0]` happens to be right today, but nothing in the ABI promises
   it: a wallet, a paymaster, or any added emit would silently shift it and the app would
   then fund the wrong grant number. Decoding the named event is the only way to be sure
   which log is which. */
function createdGrantId(logs: readonly Log[], escrow: Address): bigint {
  const fromEscrow = logs.filter((log) => log.address.toLowerCase() === escrow.toLowerCase());
  const [created] = parseEventLogs({ abi: grantEscrowAbi, eventName: "GrantCreated", logs: fromEscrow });
  if (!created) throw new Error("The transaction didn't report a new bonus number. Nothing was funded.");
  return created.args.grantId;
}

export const chainAdapter = {
  connectWallet: async () => (await wallet()).account,
  /* Additive (spec §10.3). Reads eth_accounts, which never prompts, so the app
     can render a connected state on load and can resolve the viewer's role.
     Returns undefined when no provider exists. */
  currentAccount: async (): Promise<string | undefined> => {
    if (!window.ethereum) return undefined;
    try {
      const accounts = (await window.ethereum.request({ method: "eth_accounts" })) as string[];
      return accounts[0];
    } catch {
      return undefined;
    }
  },
  getGrant: async (grantId: bigint): Promise<DemoGrant> => {
    const configured = config();
    const result = await publicClient.readContract({ address: configured.grantEscrow, abi: grantEscrowAbi, functionName: "grants", args: [grantId] });
    const [employer, contractor, selectedToken, rawEscrowAmount, fundedUsdgAmount, , deadline, milestone, status] = result;
    if (!employer || employer === "0x0000000000000000000000000000000000000000") throw new Error("Grant was not found on the configured test contract.");
    const stock = stockByAddress(configured.stocks, selectedToken);
    if (!stock) throw new Error("Grant uses a token outside the configured test-stock allowlist.");
    /* Released and timeout-claimed share one status on chain. The event's
       timeoutClaim flag is the only honest way to tell them apart, so read it
       when the grant is unlocked. If the log range is refused, say nothing
       rather than guess (§11.4). */
    let releasedBy: DemoGrant["releasedBy"];
    if (status === 2) {
      try {
        const events = await publicClient.getContractEvents({ address: configured.grantEscrow, abi: grantEscrowAbi, eventName: "GrantReleased", args: { grantId }, fromBlock: 0n });
        const last = events[events.length - 1];
        if (last) releasedBy = last.args.timeoutClaim ? "timeout" : "employer";
      } catch {
        releasedBy = undefined;
      }
    }
    return { id: `GRANT-${grantId.toString().padStart(4, "0")}`, contractor: `${contractor.slice(0, 6)}…${contractor.slice(-4)}`, employerAddress: employer, contractorAddress: contractor, releasedBy, stock, stockAmount: formatUnits(rawEscrowAmount, 18), usdgAmount: formatUnits(fundedUsdgAmount, 18), milestone, deadline: new Date(Number(deadline) * 1000).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }), deadlineTimestamp: Number(deadline), state: status === 1 ? "LOCKED" : status === 2 ? "CLAIMED" : "LOCKED" };
  },
  /* The employer's bonuses, discovered from chain logs rather than a browser store. The
     contract cannot list grants by employer, but `employer` is indexed on GrantCreated, so
     the logs answer the same question and survive a cleared browser or a different device. */
  getGrantsByEmployer: async (employer: string): Promise<bigint[]> => {
    const configured = config();
    const events = await publicClient.getContractEvents({
      address: configured.grantEscrow,
      abi: grantEscrowAbi,
      eventName: "GrantCreated",
      args: { employer: employer as Address },
      fromBlock: 0n
    });
    /* Newest first: the most recent bonus is the one being looked for. */
    return events.map((event) => event.args.grantId).reverse();
  },
  /* The optional second argument is the additive change of spec §8.3: it fires
     immediately before each of the three writes, so the form can show which
     request the wallet is asking for. Callers that omit it behave exactly as
     before. */
  fundGrant: async (input: FundGrantInput, onStage?: (stage: 1 | 2 | 3) => void): Promise<bigint> => {
    const configured = config();
    const { account, client } = await wallet();
    const deadline = BigInt(Math.floor(input.deadline.getTime() / 1000));
    const usdgAmount = parseUnits(input.usdgAmount, 18);
    const minStockOut = parseUnits(input.minStockOut ?? input.usdgAmount, 18);
    /* Rule 9: the swap carries a transaction deadline so a request left pending in the wallet
       cannot settle against stale state later. Twenty minutes is the window the demo allows
       between approving and funding. */
    const swapDeadline = BigInt(Math.floor(Date.now() / 1000) + 20 * 60);
    onStage?.(1);
    const createHash = await client.writeContract({ address: configured.grantEscrow, abi: grantEscrowAbi, functionName: "createGrant", args: [input.contractor, deadline], account });
    const createReceipt = await publicClient.waitForTransactionReceipt({ hash: createHash });
    const grantId = createdGrantId(createReceipt.logs, configured.grantEscrow);
    onStage?.(2);
    const approvalHash = await client.writeContract({ address: configured.usdg, abi: erc20Abi, functionName: "approve", args: [configured.grantEscrow, usdgAmount], account });
    await publicClient.waitForTransactionReceipt({ hash: approvalHash });
    onStage?.(3);
    /* The milestone is part of the funded agreement now, so it goes on chain with the
       amount rather than into this browser. */
    const fundHash = await client.writeContract({ address: configured.grantEscrow, abi: grantEscrowAbi, functionName: "fundGrant", args: [grantId, usdgAmount, configured.stocks[input.stock], minStockOut, swapDeadline, input.milestone], account });
    await publicClient.waitForTransactionReceipt({ hash: fundHash });
    return grantId;
  },
  releaseGrant: async (grantId: bigint) => { const { account, client } = await wallet(); const hash = await client.writeContract({ address: config().grantEscrow, abi: grantEscrowAbi, functionName: "releaseGrant", args: [grantId], account }); await publicClient.waitForTransactionReceipt({ hash }); },
  claimAfterTimeout: async (grantId: bigint) => { const { account, client } = await wallet(); const hash = await client.writeContract({ address: config().grantEscrow, abi: grantEscrowAbi, functionName: "claimAfterTimeout", args: [grantId], account }); await publicClient.waitForTransactionReceipt({ hash }); }
};
