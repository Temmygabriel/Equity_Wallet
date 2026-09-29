import { type FormEvent, useMemo, useState } from "react";
import { chainAdapter, type DemoGrant, type GrantState } from "./chainAdapter";

const routes = ["/", "/employer/fund", "/employer/grants", "/contractor/grant"] as const;
type Route = (typeof routes)[number];

const initialGrant: DemoGrant = {
  id: "GRANT-0000", contractor: "Configure a test grant", stock: "AAPL", stockAmount: "—", usdgAmount: "—",
  milestone: "Ship the Robinhood Chain testnet integration", deadline: "15 October 2026", state: "LOCKED"
};

function useRoute(): [Route, (route: Route) => void] {
  const initial = routes.includes(window.location.pathname as Route) ? window.location.pathname as Route : "/";
  const [route, setRoute] = useState<Route>(initial);
  return [route, (next) => { window.history.pushState({}, "", next); setRoute(next); }];
}

function Header({ navigate }: { navigate: (route: Route) => void }) {
  const [wallet, setWallet] = useState<string>();
  const [error, setError] = useState<string>();
  const connect = async () => {
    try { setWallet(await chainAdapter.connectWallet()); setError(undefined); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Wallet connection failed."); }
  };
  return <>
    <header className="site-header">
      <button className="wordmark" onClick={() => navigate("/")}>Equity <span>Benefit Wallet</span></button>
      <nav aria-label="Primary navigation"><button onClick={() => navigate("/employer/fund")}>For employers</button><button onClick={() => navigate("/contractor/grant")}>For contractors</button></nav>
      <button className="wallet-button" onClick={connect}>{wallet ? `${wallet.slice(0, 6)}…${wallet.slice(-4)}` : "Connect wallet"}</button>
    </header>
    {error && <p className="wallet-error" role="alert">{error}</p>}
  </>;
}

function StatusSeal({ state }: { state: GrantState }) {
  const label = state === "LOCKED" ? "Locked" : state === "UNLOCKED" ? "Unlocked" : "Claimed";
  return <span className={`seal seal-${state.toLowerCase()}`} aria-label={`Grant status: ${label}`}><span>{label}</span><i>EBW</i></span>;
}

function Certificate({ grant }: { grant: DemoGrant }) {
  const status = grant.state === "LOCKED" ? "Locked · held" : grant.state === "UNLOCKED" ? "Unlocked" : "Claimed";
  return <article className="cert" aria-label={`${grant.stock} equity benefit grant certificate`}>
    <div className="cert-inner"><div className="cert-core">
      <div className="cert-top"><div><p className="cert-kicker">Equity Benefit Wallet</p><p className="cert-subtitle">Contract-held benefit certificate</p></div><StatusSeal state={grant.state} /></div>
      <div className="cert-title"><span>Grant of</span><strong>{grant.stock}</strong><small>{grant.stockAmount} test stock tokens</small></div>
      <div className="cert-rule"><span /></div>
      <dl className="certificate-details">
        <div className="detail-primary"><dt>In recognition of</dt><dd>{grant.milestone}</dd></div>
        <div className="detail-grid"><div><dt>Release date</dt><dd>{grant.deadline}</dd></div><div><dt>Current state</dt><dd>{status}</dd></div></div>
      </dl>
      <footer className="certificate-foot"><span>Reference {grant.id}</span><span>Robinhood Chain Testnet</span></footer>
    </div></div>
  </article>;
}

function Notice() { return <p className="testnet-notice">Robinhood Chain Testnet demo. Assets shown here are test contracts, not real securities.</p>; }

function Landing({ navigate }: { navigate: (route: Route) => void }) {
  return <main className="landing">
    <Notice />
    <section className="hero">
      <div className="hero-copy">
        <p className="eyebrow">For thoughtful contractor rewards</p>
        <h1>Give a bonus<br /><em>that stays meaningful.</em></h1>
        <p className="lede">An employer gives a contractor a stock-based bonus. The contract holds it until the agreed milestone and deadline.</p>
        <div className="actions"><button className="button button-primary" onClick={() => navigate("/employer/fund")}>Give a bonus</button><button className="button button-secondary" onClick={() => navigate("/contractor/grant")}>Claim your bonus</button></div>
      </div>
      <div className="hero-instrument"><div className="instrument-label">A formal record of work</div><Certificate grant={initialGrant} /></div>
    </section>
    <section className="sequence" aria-labelledby="how-it-works"><div className="sequence-intro"><p className="eyebrow">A clear agreement, held in code</p><h2 id="how-it-works">A bonus with a<br />built-in backstop.</h2></div><ol><li><span>01</span><p><strong>Choose the bonus.</strong> The employer creates a Grant for a contractor and the work they agreed.</p></li><li><span>02</span><p><strong>The contract holds it.</strong> Test stock stays in the Grant while the work is completed.</p></li><li><span>03</span><p><strong>Release or claim.</strong> The employer releases it, or the contractor claims after the deadline.</p></li></ol></section>
    <section className="assurance"><div><p className="eyebrow">The quiet part, made certain</p><h2>No trust required.</h2></div><p>Your bonus isn't held by a company or an app. A contract holds it. If your employer goes quiet, you can claim it yourself, automatically, on the date shown above — no lawyer, no waiting on goodwill.</p></section>
  </main>;
}

function EmployerFund() {
  const [stock, setStock] = useState<DemoGrant["stock"]>("AAPL");
  const [message, setMessage] = useState<string>();
  const [busy, setBusy] = useState(false);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); const form = new FormData(event.currentTarget);
    try { setBusy(true); const id = await chainAdapter.fundGrant({ contractor: form.get("contractor") as `0x${string}`, deadline: new Date(form.get("deadline") as string), stock, usdgAmount: form.get("usdg") as string }); setMessage(`Grant ${id.toString()} was funded on testnet. Share this Grant ID with the contractor.`); }
    catch (reason) { setMessage(reason instanceof Error ? reason.message : "Funding failed."); } finally { setBusy(false); }
  };
  return <main className="page-shell employer-page"><Notice /><section className="page-heading"><p className="eyebrow">Employer workspace</p><h1>Prepare a benefit<br /><em>worth keeping.</em></h1><p>Set the terms once. The contract holds the bonus until you release it or the deadline gives the contractor a claim.</p></section><div className="agreement-layout"><form className="agreement-form" onSubmit={submit}>
    <fieldset><legend><span>01</span> Who is this for?</legend><label>Contractor wallet address<input required name="contractor" placeholder="0x…" pattern="0x[a-fA-F0-9]{40}" /></label></fieldset>
    <fieldset><legend><span>02</span> What did you agree?</legend><label>Milestone<input name="milestone" required defaultValue={initialGrant.milestone} /></label><label>Deadline<input required name="deadline" type="date" /></label></fieldset>
    <fieldset><legend><span>03</span> What is the bonus?</legend><div className="form-row"><label>Test stock<select value={stock} onChange={(event) => setStock(event.target.value as DemoGrant["stock"])}><option>AAPL</option><option>TSLA</option><option>NVDA</option></select></label><label>USDG amount<input required name="usdg" type="number" min="1" step="0.000001" defaultValue="100" /></label></div></fieldset>
    <div className="form-submit"><p>You will approve USDG, then fund the Grant in separate testnet transactions.</p><button className="button button-primary" disabled={busy} type="submit">{busy ? "Funding…" : "Review and fund"}</button></div>{message && <p className="form-notice" role="status">{message}</p>}
  </form><aside className="agreement-preview"><p className="eyebrow">Benefit instrument</p><div className="preview-stock">{stock}<span>Test stock grant</span></div><dl><div><dt>Funding path</dt><dd>USDG → {stock}</dd></div><div><dt>Custody</dt><dd>The contract</dd></div><div><dt>Fallback</dt><dd>Contractor claim at deadline</dd></div></dl><p>Assets shown are test contracts, not real securities.</p></aside></div></main>;
}

function EmployerGrants({ navigate }: { navigate: (route: Route) => void }) { return <main className="page-shell"><Notice /><section className="page-heading"><p className="eyebrow">Employer workspace</p><h1>Your Grants</h1><p>Each funded Grant is a formal, contract-held record. Open the contractor view to read a Grant by its ID.</p><button className="button button-primary" onClick={() => navigate("/employer/fund")}>Give a bonus</button></section><section className="ledger-note"><span>Grant ledger</span><p>This testnet MVP reads Grants by ID. Share the funded Grant ID with the contractor so they can review the certificate and claim path.</p></section></main>; }

function ContractorGrant() {
  const [grantId, setGrantId] = useState("0"); const [grant, setGrant] = useState<DemoGrant>(initialGrant); const [message, setMessage] = useState<string>(); const [busy, setBusy] = useState(false);
  const id = () => BigInt(grantId);
  const load = async () => { try { setBusy(true); setGrant(await chainAdapter.getGrant(id())); setMessage("Grant loaded from the configured Robinhood testnet contract."); } catch (reason) { setMessage(reason instanceof Error ? reason.message : "Could not read Grant."); } finally { setBusy(false); } };
  const act = async (action: "release" | "claim") => { try { setBusy(true); if (action === "release") await chainAdapter.releaseGrant(id()); else await chainAdapter.claimAfterTimeout(id()); await load(); } catch (reason) { setMessage(reason instanceof Error ? reason.message : "Transaction failed."); } finally { setBusy(false); } };
  const state = useMemo(() => grant.state, [grant]);
  const heading = state === "CLAIMED" ? "This Grant is complete." : state === "UNLOCKED" ? "Your bonus is unlocked." : "Your Grant is held safely.";
  return <main className="contractor-page"><Notice /><section className="contractor-intro"><p className="eyebrow">Contractor view</p><h1>Your work,<br /><em>formally recognised.</em></h1><p>Load your Grant ID to see the stock bonus held for you, the milestone it recognises, and the date it becomes yours.</p><div className="grant-loader"><label>Grant ID<input aria-label="Grant ID" value={grantId} onChange={(event) => setGrantId(event.target.value)} inputMode="numeric" /></label><button className="button button-secondary" onClick={load} disabled={busy}>Load Grant</button></div></section><Certificate grant={grant} /><section className="claim-panel"><div><p className="eyebrow">Your next step</p><h2>{heading}</h2><p>{message ?? (state === "CLAIMED" ? "The certificate has been paid to the contractor." : "The employer can release now before the deadline. If they do not, you can claim it yourself on or after the deadline.")}</p></div><div className="claim-actions">{state === "LOCKED" && <><button className="button button-primary" onClick={() => act("release")} disabled={busy}>Release now</button><button className="text-action" onClick={() => act("claim")} disabled={busy}>Claim it yourself after deadline</button></>}{state === "UNLOCKED" && <button className="button button-primary" onClick={() => act("release")} disabled={busy}>Release now</button>}{state === "CLAIMED" && <span className="claimed-copy">Certificate complete</span>}</div></section></main>;
}

export function App() { const [route, navigate] = useRoute(); return <><Header navigate={navigate} />{route === "/" && <Landing navigate={navigate} />}{route === "/employer/fund" && <EmployerFund />}{route === "/employer/grants" && <EmployerGrants navigate={navigate} />}{route === "/contractor/grant" && <ContractorGrant />}<footer className="site-footer"><span>Equity Benefit Wallet</span><span>Robinhood Chain Testnet · mock contracts only</span></footer></>; }
