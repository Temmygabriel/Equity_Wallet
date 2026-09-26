import { type FormEvent, useMemo, useState } from "react";
import { demoAdapter, demoGrant, type DemoGrant, type GrantState } from "./chainAdapter";

const routes = ["/", "/employer/fund", "/employer/grants", "/contractor/grant"] as const;
type Route = (typeof routes)[number];

function useRoute(): [Route, (route: Route) => void] {
  const current = routes.includes(window.location.pathname as Route)
    ? (window.location.pathname as Route)
    : "/";
  const [route, setRoute] = useState<Route>(current);
  const navigate = (next: Route) => {
    window.history.pushState({}, "", next);
    setRoute(next);
  };
  return [route, navigate];
}

function Header({ navigate }: { navigate: (route: Route) => void }) {
  return <header className="site-header"><button className="wordmark" onClick={() => navigate("/")}>Equity Benefit Wallet</button><nav aria-label="Primary navigation"><button onClick={() => navigate("/employer/fund")}>For employers</button><button onClick={() => navigate("/contractor/grant")}>For contractors</button></nav><span className="network-note">Robinhood Chain testnet · demo</span></header>;
}

function Badge({ state }: { state: GrantState }) {
  const label = state === "LOCKED" ? "Locked" : state === "UNLOCKED" ? "Unlocked" : "Claimed";
  return <span className={`seal seal-${state.toLowerCase()}`} aria-label={`Grant status: ${label}`}>{label}</span>;
}

function Certificate({ grant, compact = false }: { grant: DemoGrant; compact?: boolean }) {
  const stateLabel = grant.state === "LOCKED" ? "Locked — held" : grant.state === "UNLOCKED" ? "Unlocked" : "Claimed";
  return <article className={`cert ${compact ? "cert-compact" : ""}`} aria-label={`${grant.stock} benefit grant certificate`}><div className="cert-inner"><div className="cert-core"><div className="cert-top"><p className="eyebrow">Equity benefit grant</p><Badge state={grant.state} /></div><div className="cert-value"><span>{grant.stock}</span><strong>{grant.stockAmount}</strong><small>stock tokens</small></div><div className="rule" /><dl className="certificate-details"><div><dt>Milestone</dt><dd>{grant.milestone}</dd></div><div><dt>Deadline</dt><dd>{grant.deadline}</dd></div><div><dt>Grant status</dt><dd>{stateLabel}</dd></div></dl><footer className="certificate-foot"><span>{grant.id}</span><span>Demo certificate</span></footer></div></div></article>;
}

function Landing({ navigate }: { navigate: (route: Route) => void }) {
  return <><main className="landing"><section className="hero"><div className="hero-copy"><p className="eyebrow">For thoughtful contractor rewards</p><h1>Give a bonus that stays meaningful.</h1><p className="lede">Equity Benefit Wallet lets employers hold a stock-token bonus in a simple onchain grant until a contractor earns it.</p><div className="actions"><button className="button button-primary" onClick={() => navigate("/employer/fund")}>Give a bonus</button><button className="button button-secondary" onClick={() => navigate("/contractor/grant")}>Claim your bonus</button></div><p className="trust-copy">The contract holds your selected stock until the milestone is confirmed. If it is not released by the deadline, <strong>claim it yourself</strong>.</p></div><Certificate grant={demoGrant} /></section><section className="how-it-works" aria-labelledby="how-title"><p className="eyebrow">A clear agreement, not a black box</p><h2 id="how-title">How it works</h2><ol><li><span>01</span><div><h3>Choose the bonus</h3><p>Select AAPL, TSLA, or NVDA and set the USDG funding amount.</p></div></li><li><span>02</span><div><h3>Fund the grant</h3><p>The contract holds the selected stock for the contractor and records the deadline.</p></div></li><li><span>03</span><div><h3>Release or claim</h3><p>Release now when the milestone is met, or let the contractor claim it themselves after the deadline.</p></div></li></ol></section></main></>;
}

function EmployerFund({ navigate }: { navigate: (route: Route) => void }) {
  const [stock, setStock] = useState<DemoGrant["stock"]>("AAPL");
  const [submitted, setSubmitted] = useState(false);
  const submit = async (event: FormEvent) => { event.preventDefault(); await demoAdapter.fundGrant(); setSubmitted(true); };
  return <main className="page-shell"><section className="page-heading"><p className="eyebrow">Employer workspace · demo</p><h1>Fund a benefit grant</h1><p>Review every detail before funding. This screen is a testnet demonstration and will not submit a transaction.</p></section><div className="form-layout"><form className="paper-form" onSubmit={submit}><label>Contractor address<input required defaultValue="0x7a31…4C8e" aria-describedby="address-note" /></label><p id="address-note" className="field-note">Demo address only. A real wallet is not connected.</p><label>Milestone<input required defaultValue={demoGrant.milestone} /></label><div className="form-row"><label>Deadline<input required type="date" defaultValue="2026-10-15" /></label><label>Selected stock<select value={stock} onChange={(event) => setStock(event.target.value as DemoGrant["stock"])}><option>AAPL</option><option>TSLA</option><option>NVDA</option></select></label></div><label>USDG funding amount<input required type="number" min="1" defaultValue="1250" /></label><button className="button button-primary" type="submit">Review and fund</button>{submitted && <p className="form-notice" role="status">Demo funding prepared. No wallet or contract transaction was sent.</p>}</form><aside className="review-slip"><p className="eyebrow">Grant summary</p><h2>{stock} contractor bonus</h2><dl><div><dt>Funding</dt><dd>1,250 USDG</dd></div><div><dt>Milestone</dt><dd>{demoGrant.milestone}</dd></div><div><dt>Release</dt><dd>Employer before 15 October 2026</dd></div></dl><p>The contract will hold the selected stock until you release it, or until the contractor can claim it themselves.</p></aside></div></main>;
}

function EmployerGrants({ navigate }: { navigate: (route: Route) => void }) {
  return <main className="page-shell"><section className="page-heading inline-heading"><div><p className="eyebrow">Employer workspace · demo</p><h1>Your grants</h1></div><button className="button button-primary" onClick={() => navigate("/employer/fund")}>Give a bonus</button></section><section className="grant-ledger"><div className="ledger-head"><span>Grant</span><span>Contractor</span><span>Milestone</span><span>Deadline</span><span>Status</span></div><button className="ledger-row" onClick={() => navigate("/contractor/grant")}><strong>{demoGrant.stock} · {demoGrant.stockAmount}</strong><span>{demoGrant.contractor}</span><span>{demoGrant.milestone}</span><span>{demoGrant.deadline}</span><Badge state="LOCKED" /></button></section><section className="ledger-note"><p className="eyebrow">Held in the contract</p><p>1 active grant · 12.50 AAPL held · all figures are illustrative testnet demo data.</p></section></main>;
}

function ContractorGrant() {
  const [state, setState] = useState<GrantState>("LOCKED");
  const [deadlineReached, setDeadlineReached] = useState(false);
  const grant = useMemo(() => ({ ...demoGrant, state }), [state]);
  const release = async () => { await demoAdapter.releaseGrant(); setState("UNLOCKED"); };
  const claim = async () => { await demoAdapter.claimAfterTimeout(); setState("CLAIMED"); };
  return <main className="contractor-page"><section className="contractor-intro"><p className="eyebrow">Contractor view · demo</p><h1>Your equity bonus</h1><p>This Grant is held by the contract. No wallet is connected and no onchain action will be sent from this demonstration.</p></section><Certificate grant={grant} /><section className="claim-panel"><div><p className="eyebrow">Milestone and deadline</p><h2>{state === "LOCKED" ? "Your grant is Locked" : state === "UNLOCKED" ? "Your bonus is Unlocked" : "Your bonus is Claimed"}</h2><p>{state === "LOCKED" ? "Countdown: 19 days remaining (demo). The employer can release now when the milestone is complete." : state === "UNLOCKED" ? "The employer released this demo grant. Claim your bonus to complete the illustration." : "This demo grant has been marked as claimed."}</p></div><div className="claim-actions">{state === "LOCKED" && <><button className="button button-primary" onClick={release}>Release now</button><button className="button button-secondary" onClick={() => setDeadlineReached(true)}>Simulate deadline</button>{deadlineReached && <button className="button button-claim" onClick={claim}>Claim it yourself</button>}</>}{state === "UNLOCKED" && <button className="button button-claim" onClick={claim}>Claim your bonus</button>}{state === "CLAIMED" && <span className="claimed-copy">Certificate complete</span>}</div></section></main>;
}

export function App() {
  const [route, navigate] = useRoute();
  return <><Header navigate={navigate} />{route === "/" && <Landing navigate={navigate} />}{route === "/employer/fund" && <EmployerFund navigate={navigate} />}{route === "/employer/grants" && <EmployerGrants navigate={navigate} />}{route === "/contractor/grant" && <ContractorGrant />}<footer className="site-footer"><span>Equity Benefit Wallet</span><span>Testnet demo · no live blockchain data</span></footer></>;
}
