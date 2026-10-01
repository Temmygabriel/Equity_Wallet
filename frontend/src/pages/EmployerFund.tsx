import { useMemo, useState, type FormEvent } from "react";
import { chainAdapter } from "../chainAdapter";
import { Certificate, type CertState } from "../components/Certificate";
import { IconAlert, IconCalendar, IconCheck, IconCopy } from "../components/icons";
import { StockPicker, stockLabel, type StockTicker } from "../components/StockPicker";
import { dollarLabel } from "../amount";

/* Required strings (§8.1, §8.5). No first person, no "please", one sentence. */
const ADDRESS_ERROR = "That address isn't valid. Paste the full 0x address.";
const DEADLINE_ERROR = "That deadline's already passed. Pick a later date.";
const WALLET_DECLINED = "The wallet declined the request. Nothing was funded.";
const SWAP_SHORT = "The swap returned less than expected. Nothing was funded.";
const CHAIN_ERROR = "Switch your wallet to Robinhood Chain Testnet (46630).";

const ADDRESS_PATTERN = /^0x[a-fA-F0-9]{40}$/;

const STAGES = ["Creating the agreement", "Approving USDG", "Locking the bonus"];

function shortAddress(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

/* Clipboard access can be blocked. Only claim a copy when it actually landed. */
async function copyText(value: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    return false;
  }
}

function formatAmount(raw: string): string {
  return dollarLabel(raw) ?? "$0";
}

function longDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });
}

/* §8.5: map whatever the wallet or the contract threw onto one sentence. */
function describeFundError(reason: unknown): string {
  const message = reason instanceof Error ? reason.message : "";
  const code = (reason as { code?: number } | null)?.code;
  if (code === 4001 || /user (rejected|denied)|declined/i.test(message)) return WALLET_DECLINED;
  if (/switch your wallet/i.test(message)) return CHAIN_ERROR;
  if (/minstockout|less than expected|slippage|insufficient/i.test(message)) return SWAP_SHORT;
  const firstLine = message.split("\n")[0]?.trim();
  return firstLine ? firstLine : "The request failed.";
}

type Step = "form" | "review" | "progress" | "done";

export function EmployerFund({ navigate }: { navigate: (to: string) => void }) {
  const [step, setStep] = useState<Step>("form");
  const [contractor, setContractor] = useState("");
  const [milestone, setMilestone] = useState("");
  const [deadline, setDeadline] = useState("");
  const [stock, setStock] = useState<StockTicker>("AAPL");
  const [amount, setAmount] = useState("");
  const [touchedAddress, setTouchedAddress] = useState(false);
  const [touchedDeadline, setTouchedDeadline] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [stage, setStage] = useState<1 | 2 | 3>(1);
  const [error, setError] = useState<string>();
  const [fundedId, setFundedId] = useState<string>();
  const [copied, setCopied] = useState(false);

  /* The deadline picker cannot offer today. */
  const minDeadline = useMemo(() => {
    const tomorrow = new Date();
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    return tomorrow.toISOString().slice(0, 10);
  }, []);

  const addressValid = ADDRESS_PATTERN.test(contractor);
  const deadlineValid = deadline !== "" && deadline >= minDeadline;
  const amountValue = Number(amount);
  const amountValid = Number.isFinite(amountValue) && amountValue >= 1;
  const canReview = addressValid && deadlineValid && amountValid && milestone.trim() !== "";

  const showAddressError = (touchedAddress || submitted) && contractor !== "" && !addressValid;
  const showDeadlineError = (touchedDeadline || submitted) && deadline !== "" && !deadlineValid;

  /* The panel certificate is the same object the contractor will see. */
  const certState: CertState = step === "done" ? "held" : "draft";
  const certRecipient = addressValid ? shortAddress(contractor) : undefined;
  const certDate = deadlineValid ? longDate(deadline) : undefined;
  const certMilestone = milestone.trim() === "" ? undefined : milestone.trim();
  const nothingEntered = contractor === "" && milestone === "" && deadline === "" && amount === "";

  const link = fundedId ? `${window.location.origin}/contractor/grant?id=${fundedId}` : "";

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
    setError(undefined);
    if (!canReview) return;
    setStep("review");
  };

  const fund = async () => {
    setError(undefined);
    setStage(1);
    setStep("progress");
    try {
      const id = await chainAdapter.fundGrant(
        {
          contractor: contractor as `0x${string}`,
          deadline: new Date(`${deadline}T00:00:00Z`),
          stock,
          usdgAmount: amount,
          milestone: milestone.trim()
        },
        (next) => setStage(next)
      );
      /* Nothing is written to this browser. The amount and the milestone went on chain with
         the funding transaction, so the contractor's link carries the whole agreement to
         whatever machine opens it. */
      const raw = id.toString();
      setFundedId(raw);
      setStep("done");
    } catch (reason) {
      /* A failed step never leaves the UI in the success state. */
      setError(describeFundError(reason));
      setStep("review");
    }
  };

  const copyLink = async () => {
    if (await copyText(link)) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    }
  };

  const startAnother = () => {
    setContractor("");
    setMilestone("");
    setDeadline("");
    setStock("AAPL");
    setAmount("");
    setTouchedAddress(false);
    setTouchedDeadline(false);
    setSubmitted(false);
    setError(undefined);
    setFundedId(undefined);
    setCopied(false);
    setStep("form");
  };

  return (
    <main className="wrap fund">
      <div className="fund-head">
        <h1>Give a bonus.</h1>
        <p>
          Set the terms once. The contract holds the bonus until you release it, or until the deadline gives the
          contractor a claim.
        </p>
      </div>

      <div className={`fund-layout${step === "review" ? " is-review" : ""}`}>
        <div className="fund-col" key={step}>
          {step === "form" && (
            <form onSubmit={submit}>
              <section className="fsect">
                <h2>Who is it for?</h2>
                <div className="fsect-fields">
                  <div className="field">
                    <label htmlFor="contractor">Contractor wallet address</label>
                    <input
                      id="contractor"
                      name="contractor"
                      placeholder="0x…"
                      required
                      autoComplete="off"
                      spellCheck={false}
                      value={contractor}
                      onChange={(event) => setContractor(event.target.value)}
                      onBlur={() => setTouchedAddress(true)}
                      aria-invalid={showAddressError || undefined}
                      aria-describedby={showAddressError ? "contractor-error" : undefined}
                    />
                    {showAddressError && (
                      <p className="field-error" id="contractor-error" role="alert">
                        <IconAlert size={16} />
                        {ADDRESS_ERROR}
                      </p>
                    )}
                  </div>
                </div>
              </section>

              <section className="fsect">
                <h2>What did you agree?</h2>
                <div className="fsect-fields">
                  <div className="field">
                    <label htmlFor="milestone">What "done" looks like</label>
                    <input
                      id="milestone"
                      name="milestone"
                      required
                      /* The contract rejects over 280 characters, so the field stops at the
                         same bound rather than letting the wallet reject it after signing. */
                      maxLength={280}
                      value={milestone}
                      onChange={(event) => setMilestone(event.target.value)}
                    />
                  </div>

                  <div className="field">
                    <label htmlFor="deadline">Deadline</label>
                    <span className="date-field">
                      <span className="date-slot" aria-hidden="true">
                        <IconCalendar size={16} />
                      </span>
                      <input
                        id="deadline"
                        name="deadline"
                        type="date"
                        required
                        min={minDeadline}
                        value={deadline}
                        onChange={(event) => setDeadline(event.target.value)}
                        onBlur={() => setTouchedDeadline(true)}
                        aria-invalid={showDeadlineError || undefined}
                        aria-describedby={showDeadlineError ? "deadline-error deadline-note" : "deadline-note"}
                      />
                    </span>
                    <p className="deadline-note" id="deadline-note">
                      If you haven't released it by this date, they can claim it automatically.
                    </p>
                    {showDeadlineError && (
                      <p className="field-error" id="deadline-error" role="alert">
                        <IconAlert size={16} />
                        {DEADLINE_ERROR}
                      </p>
                    )}
                    <p className="field-note">
                      Written into the contract when you fund it, so the certificate reads the same on any device.
                    </p>
                  </div>
                </div>
              </section>

              <section className="fsect">
                <h2>What is the bonus?</h2>
                <div className="fsect-fields">
                  <StockPicker value={stock} onChange={setStock} />

                  <div className="field">
                    <label htmlFor="amount">Bonus amount</label>
                    <span className="amount-field">
                      <span className="cur" aria-hidden="true">
                        $
                      </span>
                      <input
                        id="amount"
                        name="amount"
                        type="number"
                        min="1"
                        step="0.000001"
                        inputMode="decimal"
                        required
                        value={amount}
                        onChange={(event) => setAmount(event.target.value)}
                        aria-describedby="amount-note"
                      />
                      <span className="unit">USDG</span>
                    </span>
                    <p className="field-note" id="amount-note">
                      Paid in USDG, converted to the stock you picked when it's funded.
                    </p>
                  </div>
                </div>
              </section>

              {error && (
                <p className="form-error" role="alert">
                  <IconAlert size={16} />
                  {error}
                </p>
              )}

              <div className="fund-actions">
                <button className="btn btn-ink" type="submit">
                  Review the bonus
                </button>
              </div>
            </form>
          )}

          {step === "review" && (
            <div className="review">
              <h2 className="review-title">Check the terms.</h2>
              <dl>
                <div>
                  <dt>Who</dt>
                  <dd>
                    <span title={contractor}>{shortAddress(contractor)}</span>
                    <button
                      className="icon-button"
                      type="button"
                      aria-label="Copy the contractor address"
                      onClick={() => void copyText(contractor)}
                    >
                      <IconCopy size={16} />
                    </button>
                  </dd>
                </div>
                <div>
                  <dt>What for</dt>
                  <dd>{milestone.trim()}</dd>
                </div>
                <div>
                  <dt>How much</dt>
                  <dd>
                    {formatAmount(amount)} in USDG
                  </dd>
                </div>
                <div>
                  <dt>Which stock</dt>
                  <dd>{stockLabel(stock)} test stock</dd>
                </div>
                <div>
                  <dt>When</dt>
                  <dd>Claimable by the contractor from {longDate(deadline)}</dd>
                </div>
                <div>
                  <dt>What happens next</dt>
                  <dd>
                    The contract holds the bonus. You can release it any time before that date. After it, the
                    contractor can claim it themselves.
                  </dd>
                </div>
              </dl>

              {error && (
                <p className="form-error" role="alert">
                  <IconAlert size={16} />
                  {error}
                </p>
              )}

              <div className="fund-actions">
                <button className="btn btn-ink" type="button" onClick={() => void fund()}>
                  Fund this bonus
                </button>
                <button className="text-action" type="button" onClick={() => setStep("form")}>
                  Edit the terms
                </button>
              </div>
            </div>
          )}

          {step === "progress" && (
            <ol className="prog">
              {STAGES.map((label, index) => {
                const number = (index + 1) as 1 | 2 | 3;
                const done = number < stage;
                const active = number === stage;
                return (
                  <li
                    key={label}
                    className={done ? "is-done" : active ? "is-active" : "is-pending"}
                    aria-current={active ? "step" : undefined}
                  >
                    <span className="n">{done ? <IconCheck size={16} /> : index + 1}</span>
                    <span>
                      {label}
                      {active && <span className="prog-help">Confirm in your wallet.</span>}
                    </span>
                  </li>
                );
              })}
            </ol>
          )}

          {step === "done" && (
            <div className="done">
              <h2>Your bonus is held.</h2>
              <p>Send this link to the contractor. It opens their certificate.</p>
              <div className="copy-row">
                <span className="copy-url">{link}</span>
                <button className="icon-button" type="button" aria-label="Copy the contractor link" onClick={() => void copyLink()}>
                  {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
                </button>
              </div>
              {copied && (
                <p className="copy-note" role="status">
                  Link copied
                </p>
              )}
              <div className="fund-actions">
                <button className="text-action" type="button" onClick={startAnother}>
                  Give another bonus
                </button>
                <button className="text-action" type="button" onClick={() => navigate("/employer/grants")}>
                  Open your bonuses
                </button>
              </div>
            </div>
          )}
        </div>

        <aside className={`fund-panel${step === "review" ? " is-review" : ""}`} aria-label="Draft certificate">
          <Certificate
            state={certState}
            amount={formatAmount(amount)}
            stockName={stockLabel(stock)}
            recipient={certRecipient}
            milestone={certMilestone}
            releaseDate={certDate}
            reference={fundedId?.padStart(4, "0")}
            dimmed={nothingEntered}
          />
          <p className="fund-panel-cap">
            {step === "done" ? "Held by the contract." : "A draft. Nothing is funded until you sign."}
          </p>
        </aside>
      </div>
    </main>
  );
}
