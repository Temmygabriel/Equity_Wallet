import { IconAlert, IconClose } from "./icons";
import type { AccountView } from "../hooks/useAccount";
import type { Route, Surface } from "../routes";

type HeaderProps = {
  surface: Surface;
  navigate: (to: string) => void;
  account: AccountView;
};

export function Header({ surface, navigate, account }: HeaderProps) {
  const wrongChain = Boolean(account.address) && !account.onCorrectChain;
  const label = account.short ?? "Connect wallet";

  return (
    <>
      <header className={`site-header ${surface === "desk" ? "on-desk" : "on-paper"}`}>
        <button className="wordmark" onClick={() => navigate("/")}>
          Equity <em>Benefit Wallet</em>
        </button>

        <nav aria-label="Primary">
          <button onClick={() => navigate("/employer/fund")}>For employers</button>
          <button onClick={() => navigate("/contractor/grant")}>For contractors</button>
        </nav>

        {/* No disabled buttons: on the wrong chain this is still a real control
            that re-runs the connection and surfaces the chain error. */}
        <button
          className={`wallet-button${wrongChain ? " is-wrong" : ""}`}
          onClick={() => void account.connect()}
        >
          {wrongChain && <IconAlert size={16} />}
          {account.address && account.onCorrectChain && <span className="wallet-dot" />}
          {wrongChain ? "Switch network" : label}
        </button>
      </header>

      {account.error && (
        <p className="wallet-error" role="alert">
          <IconAlert size={16} className="icon" />
          <span>{account.error}</span>
          <button onClick={account.dismissError} aria-label="Dismiss">
            <IconClose size={16} />
          </button>
        </p>
      )}
    </>
  );
}
