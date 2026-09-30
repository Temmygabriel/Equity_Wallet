import { TESTNET_NOTICE } from "./Notice";

type FooterProps = {
  /** Gated pages also state that the jurisdiction check is not a real control (§6A.6). */
  gated?: boolean;
};

export function Footer({ gated = false }: FooterProps) {
  return (
    <footer className="site-footer">
      <span>Equity Benefit Wallet</span>
      <div className="foot-lines">
        <span>{TESTNET_NOTICE}</span>
        {gated && <span>Jurisdiction check is demo-only, not a compliance control.</span>}
      </div>
      <span>Robinhood Chain Testnet, mock contracts only</span>
    </footer>
  );
}
