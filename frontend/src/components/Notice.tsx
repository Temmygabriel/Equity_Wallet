import type { Surface } from "../routes";

/** Required verbatim string (spec §12.4). Never shortened, never hidden. */
export const TESTNET_NOTICE =
  "Robinhood Chain Testnet demo. Assets shown here are test contracts, not real securities.";

export function Notice({ surface }: { surface: Surface }) {
  if (surface === "paper") {
    /* Paper pages carry the notice in the footer, alongside the jurisdiction label. */
    return <span>{TESTNET_NOTICE}</span>;
  }
  return <p className="notice-desk">{TESTNET_NOTICE}</p>;
}
