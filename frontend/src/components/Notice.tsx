/** Required verbatim string (spec §12.4). Never shortened, never hidden. */
export const TESTNET_NOTICE =
  "Robinhood Chain Testnet demo. Assets shown here are test contracts, not real securities.";

/* Desk pages carry the notice here, quiet and bottom-left against the hero.
   Paper pages carry it in the footer instead, next to the jurisdiction label. */
export function Notice() {
  return <p className="notice-desk">{TESTNET_NOTICE}</p>;
}
