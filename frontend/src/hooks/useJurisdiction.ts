import { useCallback, useState } from "react";
import { DEMO_BLOCKED_REGIONS } from "../config/jurisdiction";

const STORAGE_KEY = "ebw.jurisdiction";

export type GateStatus = "unknown" | "passed" | "blocked";

export type Jurisdiction = {
  status: GateStatus;
  region?: string;
  choose: (region: string) => void;
  reset: () => void;
};

type GateState = { status: GateStatus; region?: string };

/* sessionStorage can throw in a private window or with site data blocked. When
   it does, the gate simply re-asks on the next load. */
function readStored(): string | undefined {
  try {
    return window.sessionStorage.getItem(STORAGE_KEY) ?? undefined;
  } catch {
    return undefined;
  }
}

/* A demo-only restriction, remembered for the browser session so it is visible
   in the demo video without being asked on every page. It is not a compliance
   control and verifies nothing. */
export function useJurisdiction(): Jurisdiction {
  const [state, setState] = useState<GateState>(() => {
    const stored = readStored();
    return stored && !DEMO_BLOCKED_REGIONS.includes(stored)
      ? { status: "passed", region: stored }
      : { status: "unknown" };
  });

  const choose = useCallback((region: string) => {
    /* A blocked choice is never remembered: a reload asks again. */
    if (DEMO_BLOCKED_REGIONS.includes(region)) {
      setState({ status: "blocked", region });
      return;
    }
    try {
      window.sessionStorage.setItem(STORAGE_KEY, region);
    } catch {
      /* Storage unavailable; the choice still holds for this page view. */
    }
    setState({ status: "passed", region });
  }, []);

  const reset = useCallback(() => {
    try {
      window.sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      /* Nothing stored to clear. */
    }
    setState({ status: "unknown" });
  }, []);

  return { status: state.status, region: state.region, choose, reset };
}
