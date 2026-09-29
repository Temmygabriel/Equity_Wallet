import { type FormEvent, useMemo, useState } from "react";
import { chainAdapter, type DemoGrant, type GrantState } from "./chainAdapter";

const routes = ["/", "/employer/fund", "/employer/grants", "/contractor/grant"] as const;
type Route = (typeof routes)[number];

/* The landing certificate is a specimen shown in the unlocked state — the hero
   moment the Design Spec asks for. It is illustrative, not a real grant. */
const specimenGrant: DemoGrant = {
  id: "GRANT-0000",
  contractor: "Specimen",
  stock: "AAPL",
  stockAmount: "120",
  usdgAmount: "held",
  milestone: "Ship the Robinhood Chain integration",
  deadline: "15 October 2026",
  deadlineTimestamp: 0,
  state: "UNLOCKED"
};

/* The testnet contract stores the deadline and the selected stock, not the
   milestone text. The description is kept with the agreement in the browser so
   the certificate can still show it, and is labelled honestly where it cannot. */
const MILESTONE_PREFIX = "ebw.milestone.";

function grantRef(id: bigint | number): string {
  return `GRANT-${id.toString().padStart(4, "0")}`;
}

function readMilestone(reference: string): string | undefined {
  try {
    return window.localStorage.getItem(MILESTONE_PREFIX + reference) ?? undefined;
  } catch {
    return undefined;
  }
}

function writeMilestone(reference: string, value: string): void {
  try {
    window.localStorage.setItem(MILESTONE_PREFIX + reference, value);
  } catch {
    /* Storage can be unavailable; the certificate falls back to its own copy. */
  }
}

function useRoute(): [Route, (route: Route) => void] {
  const initial = routes.includes(window.location.pathname as Route) ? (window.location.pathname as Route) : "/";
  const [route, setRoute] = useState<Route>(initial);
  return [
    route,
    (next) => {
      window.history.pushState({}, "", next);
      setRoute(next);
    }
  ];
}

/* ---------------------------------------------------------------------------
   Shared pieces
--------------------------------------------------------------------------- */

function Header({ navigate }: { navigate: (route: Route) => void }) {
  const [wallet, setWallet] = useState<string>();
  const [error, setError] = useState<string>();

  const connect = async () => {
    try {
      setWallet(await chainAdapter.connectWallet());
      setError(undefined);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Wallet connection failed.");
    }
  };

  return (
    <>
      <header className="site-header">
        <button className="wordmark" onClick={() => navigate("/")}>
          Equity <em>Benefit Wallet</em>
        </button>
        <nav aria-label="Primary navigation">
          <button onClick={() => navigate("/employer/fund")}>For employers</button>
          <button onClick={() => navigate("/contractor/grant")}>For contractors</button>
        </nav>
        <button className="wallet-button" onClick={connect}>
          {wallet ? `${wallet.slice(0, 6)}…${wallet.slice(-4)}` : "Connect wallet"}
        </button>
      </header>
      {error && (
        <p className="wallet-error" role="alert">
          {error}
        </p>
      )}
    </>
  );
}

function Notice() {
  return (
    <p className="testnet-notice">
      Robinhood Chain Testnet demo. Assets shown here are test contracts, not real securities.
    </p>
  );
}

/* A guilloché rosette, the interlocking line engraving real certificates use as
   their anti-copy underprint. Traced as a family of modulated rosettes in two
   coordinated brass tones. */
function Guilloche() {
  const curves = useMemo(() => {
    const petals = 16;
    const baseRadius = 100;
    const samples = 480;
    const drawn: { d: string; tone: string }[] = [];

    for (let index = 0; index < 11; index += 1) {
      const amplitude = 5 + index * 2.6;
      let d = "";
      for (let step = 0; step <= samples; step += 1) {
        const t = (step / samples) * Math.PI * 2;
        const radius = baseRadius + amplitude * Math.cos(petals * t);
        const x = (radius * Math.cos(t)).toFixed(1);
        const y = (radius * Math.sin(t)).toFixed(1);
        d += `${step === 0 ? "M" : "L"}${x} ${y}`;
      }
      drawn.push({ d: `${d}Z`, tone: index % 2 === 0 ? "g-a" : "g-b" });
    }

    return drawn;
  }, []);

  return (
    <svg className="guilloche" viewBox="-140 -140 280 280" aria-hidden="true" focusable="false">
      {curves.map((curve, index) => (
        <path key={index} className={curve.tone} d={curve.d} vectorEffect="non-scaling-stroke" />
      ))}
    </svg>
  );
}

/* Rendered only once the grant is no longer held. The state is already stated in
   the certificate's fields, so the seal itself is decorative. */
function Seal({ state }: { state: GrantState }) {
  const label = state === "UNLOCKED" ? "Unlocked" : "Claimed";
  return (
    <span className={`seal seal-${state.toLowerCase()}`} aria-hidden="true">
      <span>{label}</span>
      <i>EBW</i>
    </span>
  );
}

function Certificate({ grant, specimen = false }: { grant: DemoGrant; specimen?: boolean }) {
  const held = grant.state === "LOCKED";
  const stateLabel = grant.state === "UNLOCKED" ? "Unlocked" : grant.state === "CLAIMED" ? "Claimed" : "Held by the contract";

  return (
    <article className="cert" aria-label={`${grant.stock} equity benefit grant certificate`}>
      <div className="cert-inner">
        <div className="cert-core">
          <Guilloche />

          <header className="cert-head">
            <div>
              <p className="cert-issuer">Equity Benefit Wallet</p>
              <p className="cert-kind">Contract-held benefit certificate{specimen ? " — specimen" : ""}</p>
            </div>
            {held && <p className="cert-held">Held until {grant.deadline}</p>}
          </header>

          <div className="cert-amount">
            <p className="cert-amount-label">Grant of</p>
            <p className="cert-symbol">{grant.stock}</p>
            <p className="cert-quantity">{grant.stockAmount} test stock tokens</p>
          </div>

          <div className="cert-rule" />

          <dl className="cert-fields">
            <div className="cert-field-wide">
              <dt>In recognition of</dt>
              <dd>{grant.milestone}</dd>
            </div>
            <div className="cert-field-pair">
              <div>
                <dt>Release date</dt>
                <dd>{grant.deadline}</dd>
              </div>
              <div>
                <dt>Current state</dt>
                <dd>{stateLabel}</dd>
              </div>
            </div>
          </dl>

          <footer className="cert-foot">
            <span>Reference {grant.id}</span>
            <span>Robinhood Chain Testnet</span>
          </footer>
        </div>
      </div>
      {!held && <Seal state={grant.state} />}
    </article>
  );
}

/* ---------------------------------------------------------------------------
   Landing
--------------------------------------------------------------------------- */

const agreementSteps = [
  { title: "The employer gives the bonus", body: "They choose the contractor, the work, the deadline and the stock." },
  { title: "The bonus is funded", body: "USDG is converted into the chosen stock and moved into the contract." },
  { title: "The contract holds it", body: "The stock sits in the contract. Nobody can move it early." },
  { title: "The work is done", body: "The milestone is met, on or before the agreed deadline." },
  { title: "The employer releases it", body: "One transaction sends the stock to the contractor's own wallet." }
];

const fallbackSteps = [
  {
    title: "The deadline passes",
    body: "Nothing needs to happen for this. The deadline was fixed the moment the bonus was funded."
  },
  {
    title: "The contractor claims it",
    body: "They claim it themselves, in one transaction, straight to their own wallet."
  }
];

function Landing({ navigate }: { navigate: (route: Route) => void }) {
  return (
    <main className="landing">
      <Notice />

      <section className="hero">
        <svg className="hero-grain" aria-hidden="true" focusable="false">
          <filter id="ebw-grain">
            <feTurbulence type="fractalNoise" baseFrequency="0.82" numOctaves="3" stitchTiles="stitch" />
          </filter>
          <rect width="100%" height="100%" filter="url(#ebw-grain)" />
        </svg>

        <div className="hero-inner">
          <div className="hero-copy">
            <p className="kicker">A stock-based contractor bonus</p>
            <h1>
              A bonus that stays <em>meaningful.</em>
            </h1>
            <p className="hero-lede">
              An employer gives a contractor a bonus in stock. The contract holds it until the work is done — and if it is
              never released, the contractor can claim it themselves.
            </p>
            <div className="hero-actions">
              <button className="button button-on-ink" onClick={() => navigate("/employer/fund")}>
                Give a bonus
              </button>
              <button className="button button-quiet" onClick={() => navigate("/contractor/grant")}>
                Claim your bonus
              </button>
            </div>
          </div>

          <div className="hero-cert">
            <Certificate grant={specimenGrant} specimen />
          </div>
        </div>
      </section>

      <section className="backstop" aria-labelledby="backstop-title">
        <div className="section-inner">
          <div className="backstop-head">
            <div>
              <p className="kicker">The agreement, and what happens if it stalls</p>
              <h2 id="backstop-title">Two ways this ends.</h2>
            </div>
            <p className="prose">
              The normal path is simple: the employer confirms the work and releases the bonus. The contract exists so that
              there is a second path when that never happens.
            </p>
          </div>

          <ol className="ledger">
            {agreementSteps.map((step, index) => (
              <li key={step.title}>
                <span className="ledger-num">{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <h3>{step.title}</h3>
                  <p>{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div className="deadline-rule">
          <div className="section-inner">
            <strong>The deadline passes</strong>
            <span>If release never comes, the agreement still resolves.</span>
          </div>
        </div>

        <div className="fallback">
          <div className="section-inner">
            <ol className="ledger">
              {fallbackSteps.map((step) => (
                <li key={step.title}>
                  <span className="ledger-num">—</span>
                  <div>
                    <h3>{step.title}</h3>
                    <p>{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="assurance">
        <div className="section-inner">
          <p className="kicker">The quiet part, made certain</p>
          <h2>No trust required.</h2>
          <p className="assurance-body">
            Your bonus isn't held by a company or an app. A contract holds it. If your employer goes quiet, you can claim
            it yourself, automatically, on the date shown above — no lawyer, no waiting on goodwill.
          </p>
        </div>
      </section>
    </main>
  );
}

/* ---------------------------------------------------------------------------
   Employer
--------------------------------------------------------------------------- */

function EmployerFund() {
  const [stock, setStock] = useState<DemoGrant["stock"]>("AAPL");
  const [message, setMessage] = useState<string>();
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const milestone = String(form.get("milestone") ?? "").trim();

    try {
      setBusy(true);
      const id = await chainAdapter.fundGrant({
        contractor: form.get("contractor") as `0x${string}`,
        deadline: new Date(form.get("deadline") as string),
        stock,
        usdgAmount: form.get("usdg") as string
      });
      if (milestone) writeMilestone(grantRef(id), milestone);
      setMessage(`Grant ${id.toString()} was funded on testnet. Share this Grant ID with the contractor.`);
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : "Funding failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="page-shell">
      <Notice />

      <section className="page-heading">
        <p className="kicker">Employer workspace</p>
        <h1>Prepare a benefit worth keeping.</h1>
        <p>Set the terms once. The contract holds the bonus until you release it, or until the deadline gives the contractor a claim.</p>
      </section>

      <div className="fund-layout">
        <form className="paper-form" onSubmit={submit}>
          <fieldset>
            <legend>
              <span>01</span> Who is this for?
            </legend>
            <label>
              Contractor wallet address
              <input required name="contractor" placeholder="0x…" pattern="0x[a-fA-F0-9]{40}" />
            </label>
          </fieldset>

          <fieldset>
            <legend>
              <span>02</span> What did you agree?
            </legend>
            <label>
              What “done” looks like
              <input name="milestone" required defaultValue={specimenGrant.milestone} />
            </label>
            <p className="field-note">
              The contract stores the deadline and the stock. This description is kept with your agreement and shown on the
              certificate.
            </p>
            <label>
              Deadline
              <input required name="deadline" type="date" />
            </label>
            <p className="field-note">If you haven't released it by this date, they can claim it automatically.</p>
          </fieldset>

          <fieldset>
            <legend>
              <span>03</span> What is the bonus?
            </legend>
            <div className="form-row">
              <label>
                Test stock
                <select value={stock} onChange={(event) => setStock(event.target.value as DemoGrant["stock"])}>
                  <option>AAPL</option>
                  <option>TSLA</option>
                  <option>NVDA</option>
                </select>
              </label>
              <label>
                USDG amount
                <input required name="usdg" type="number" min="1" step="0.000001" defaultValue="100" />
              </label>
            </div>
          </fieldset>

          <button className="button button-primary" disabled={busy} type="submit">
            {busy ? "Funding…" : "Review and fund"}
          </button>
          {message && (
            <p className="form-notice" role="status">
              {message}
            </p>
          )}
        </form>

        <aside className="review-slip">
          <p className="kicker">Before you sign</p>
          <h2>{stock} test bonus</h2>
          <dl>
            <div>
              <dt>1. Create</dt>
              <dd>Set the contractor and the deadline.</dd>
            </div>
            <div>
              <dt>2. Fund</dt>
              <dd>Approve USDG, then fund the Grant.</dd>
            </div>
            <div>
              <dt>3. Hold</dt>
              <dd>The contract holds the test stock until release or a timeout claim.</dd>
            </div>
          </dl>
          <p className="review-note">The demo uses a deterministic mock adapter. Assets are test contracts, not real securities.</p>
        </aside>
      </div>
    </main>
  );
}

function EmployerGrants({ navigate }: { navigate: (route: Route) => void }) {
  return (
    <main className="page-shell">
      <Notice />
      <section className="page-heading">
        <p className="kicker">Employer workspace</p>
        <h1>Your Grants</h1>
        <p>Each funded Grant is a contract-held record. Open the contractor view to read one by its ID.</p>
        <button className="button button-primary" onClick={() => navigate("/employer/fund")}>
          Give a bonus
        </button>
      </section>
      <section className="ledger-note">
        <p className="kicker">Grant ledger</p>
        <p>
          This testnet MVP reads Grants by ID. Share the funded Grant ID with the contractor so they can review the
          certificate and the claim path.
        </p>
      </section>
    </main>
  );
}

/* ---------------------------------------------------------------------------
   Contractor
--------------------------------------------------------------------------- */

function ContractorGrant() {
  const [grantId, setGrantId] = useState("0");
  const [grant, setGrant] = useState<DemoGrant>({ ...specimenGrant, state: "LOCKED", stockAmount: "—", milestone: "Not recorded yet" });
  const [message, setMessage] = useState<string>();
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try {
      setBusy(true);
      const reference = grantRef(BigInt(grantId));
      const loaded = await chainAdapter.getGrant(BigInt(grantId));
      setGrant({ ...loaded, id: reference, milestone: readMilestone(reference) ?? loaded.milestone });
      setMessage("Grant loaded from the configured Robinhood testnet contract.");
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : "Could not read Grant.");
    } finally {
      setBusy(false);
    }
  };

  const act = async (action: "release" | "claim") => {
    try {
      setBusy(true);
      if (action === "release") await chainAdapter.releaseGrant(BigInt(grantId));
      else await chainAdapter.claimAfterTimeout(BigInt(grantId));
      await load();
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : "Transaction failed.");
    } finally {
      setBusy(false);
    }
  };

  const state = grant.state;
  /* The contract allows release only before the deadline and a timeout claim only
     at or after it, so exactly one action is ever available. */
  const deadlinePassed = grant.deadlineTimestamp > 0 && Date.now() / 1000 >= grant.deadlineTimestamp;
  const heading = state === "CLAIMED" ? "This Grant is complete." : state === "UNLOCKED" ? "Your bonus is unlocked." : "Your Grant is held.";

  return (
    <main className="contractor-page">
      <Notice />

      <section className="contractor-intro">
        <p className="kicker">Contractor view</p>
        <h1>Your work, formally recognised.</h1>
        <p>Load your Grant ID to see the stock bonus held for you, the milestone it recognises, and the date it becomes yours.</p>
        <div className="grant-loader">
          <label>
            Grant ID
            <input
              value={grantId}
              onChange={(event) => setGrantId(event.target.value)}
              inputMode="numeric"
              aria-label="Grant ID"
            />
          </label>
          <button className="button button-secondary" onClick={load} disabled={busy}>
            Load Grant
          </button>
        </div>
      </section>

      <Certificate grant={grant} />

      <dl className="grant-terms">
        <div>
          <dt>Unlocks when</dt>
          <dd>{grant.milestone}</dd>
        </div>
        <div>
          <dt>If not released by then</dt>
          <dd>Automatically yours on {grant.deadline}</dd>
        </div>
      </dl>

      <section className="claim-panel">
        <div>
          <p className="kicker">Your next step</p>
          <h2>{heading}</h2>
          <p>
            {message ??
              (state === "CLAIMED"
                ? "The certificate has been paid to the contractor."
                : "The employer can release it before the deadline. If they do not, you can claim it yourself.")}
          </p>
        </div>
        <div className="claim-actions">
          {state === "LOCKED" &&
            (deadlinePassed ? (
              <button className="button button-primary" onClick={() => act("claim")} disabled={busy}>
                Claim it yourself
              </button>
            ) : (
              <>
                <button className="button button-secondary" onClick={() => act("release")} disabled={busy}>
                  Release now
                </button>
                <p className="claim-note">The employer releases it. If they don’t, you can claim it yourself on {grant.deadline}.</p>
              </>
            ))}
          {state === "UNLOCKED" && (
            <button className="button button-primary" onClick={() => act("release")} disabled={busy}>
              Release now
            </button>
          )}
          {state === "CLAIMED" && <span className="claimed-copy">Certificate complete</span>}
        </div>
      </section>
    </main>
  );
}

export function App() {
  const [route, navigate] = useRoute();
  return (
    <>
      <Header navigate={navigate} />
      {route === "/" && <Landing navigate={navigate} />}
      {route === "/employer/fund" && <EmployerFund />}
      {route === "/employer/grants" && <EmployerGrants navigate={navigate} />}
      {route === "/contractor/grant" && <ContractorGrant />}
      <footer className="site-footer">
        <span>Equity Benefit Wallet</span>
        <span>Robinhood Chain Testnet — mock contracts only</span>
      </footer>
    </>
  );
}
