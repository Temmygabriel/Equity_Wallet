import { useCallback, useEffect, useState } from "react";
import { chainAdapter, ROBINHOOD_TESTNET_CHAIN_ID } from "../chainAdapter";

/* Wallet events are read through a narrow local type. viem's EIP1193Provider
   does not commit to `on`/`removeListener`, and the account read itself still
   goes through chainAdapter — this only listens. */
type WalletEvents = {
  on?: (event: string, listener: (payload: unknown) => void) => void;
  removeListener?: (event: string, listener: (payload: unknown) => void) => void;
};

export type AccountView = {
  address?: string;
  short?: string;
  onCorrectChain: boolean;
  error?: string;
  busy: boolean;
  connect: () => Promise<void>;
  dismissError: () => void;
};

export function shorten(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function useAccount(): AccountView {
  const [address, setAddress] = useState<string>();
  const [onCorrectChain, setOnCorrectChain] = useState(true);
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;

    /* Silent: currentAccount reads eth_accounts, which never opens a prompt.
       The app must render fully with no wallet installed. */
    void chainAdapter.currentAccount().then((found) => {
      if (!cancelled && found) setAddress(found);
    });

    const events = window.ethereum as unknown as WalletEvents | undefined;
    if (!events?.on) return () => { cancelled = true; };

    const onAccountsChanged = (payload: unknown) => {
      const next = Array.isArray(payload) ? (payload[0] as string | undefined) : undefined;
      setAddress(next ?? undefined);
    };
    const onChainChanged = (payload: unknown) => {
      const id = typeof payload === "string" ? Number.parseInt(payload, 16) : Number.NaN;
      setOnCorrectChain(id === ROBINHOOD_TESTNET_CHAIN_ID);
    };

    events.on("accountsChanged", onAccountsChanged);
    events.on("chainChanged", onChainChanged);
    return () => {
      cancelled = true;
      events.removeListener?.("accountsChanged", onAccountsChanged);
      events.removeListener?.("chainChanged", onChainChanged);
    };
  }, []);

  const connect = useCallback(async () => {
    setBusy(true);
    try {
      const found = await chainAdapter.connectWallet();
      setAddress(found);
      setOnCorrectChain(true);
      setError(undefined);
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : "Wallet connection failed.";
      if (message.includes("Switch your wallet")) setOnCorrectChain(false);
      setError(message);
    } finally {
      setBusy(false);
    }
  }, []);

  const dismissError = useCallback(() => setError(undefined), []);

  return {
    address,
    short: address ? shorten(address) : undefined,
    onCorrectChain,
    error,
    busy,
    connect,
    dismissError
  };
}
