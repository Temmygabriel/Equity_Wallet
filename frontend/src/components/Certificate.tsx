import { useEffect, useState } from "react";
import { Seal } from "./Seal";
import { Strap } from "./Strap";

export type CertState = "draft" | "held" | "released" | "claimed" | "unloaded";

export type CertificateProps = {
  state: CertState;
  /** Already resolved by the caller, with or without a dollar sign (spec §3.2). */
  amount: string;
  /** Company-linked name, no trailing "stock": "Apple-linked". Never a ticker. */
  stockName?: string;
  recipient?: string;
  milestone?: string;
  /** en-GB long format: "15 October 2026". */
  releaseDate?: string;
  /** Zero-padded grant number, without the "No." prefix. */
  reference?: string;
  /** Only read in the released state. */
  deliveredTo?: string;
  /** Delay before the seal stamps. Used once: the on-load stamp of §11.1. */
  stampDelayMs?: number;
  /** Draft with nothing entered yet: amount and rows sit at 60% (§3.3). */
  dimmed?: boolean;
};

const STATUS: Record<CertState, string> = {
  draft: "Not yet funded",
  held: "Held by the contract",
  released: "Unlocked",
  claimed: "Unlocked",
  unloaded: "-"
};

function deliveredText(state: CertState, deliveredTo?: string): string {
  if (state === "claimed") return "Claimed automatically";
  if (state === "released") return deliveredTo ?? "Claimed automatically";
  if (state === "unloaded") return "-";
  return "Pending";
}

export function Certificate({
  state,
  amount,
  stockName,
  recipient,
  milestone,
  releaseDate,
  reference,
  deliveredTo,
  stampDelayMs = 0,
  dimmed = false
}: CertificateProps) {
  const unloaded = state === "unloaded";
  const sealedState = state === "released" || state === "claimed";

  /* The seal is transition-driven, not a keyframe, so removing it animates back
     out (the preview direction of §5.2) without a force-reflow hack. The
     transition's own 350ms delay is what stages the stamp. */
  const [sealed, setSealed] = useState(sealedState && stampDelayMs === 0);
  useEffect(() => {
    if (!sealedState) {
      setSealed(false);
      return;
    }
    if (stampDelayMs === 0) {
      setSealed(true);
      return;
    }
    const timer = window.setTimeout(() => setSealed(true), stampDelayMs);
    return () => window.clearTimeout(timer);
  }, [sealedState, stampDelayMs]);

  /* The stamp lands. 650ms after the seal starts, per §5.2. */
  const [impact, setImpact] = useState(false);
  useEffect(() => {
    if (!sealedState) return;
    const start = window.setTimeout(() => setImpact(true), stampDelayMs + 650);
    const stop = window.setTimeout(() => setImpact(false), stampDelayMs + 780);
    return () => {
      window.clearTimeout(start);
      window.clearTimeout(stop);
    };
  }, [sealedState, stampDelayMs]);

  const status = STATUS[state];
  const delivered = deliveredText(state, deliveredTo);
  const referenceText = unloaded || state === "draft" ? "No. -" : `No. ${reference ?? "-"}`;
  const subLine = unloaded
    ? "Enter your bonus number"
    : `in ${stockName ?? "-"} stock${recipient ? `, for ${recipient}` : ""}`;
  const dash = "-";

  const announcement =
    state === "released"
      ? "Bonus released. Certificate unlocked."
      : state === "claimed"
        ? "Bonus claimed. Certificate unlocked."
        : state === "held"
          ? "Bonus held by the contract."
          : state === "draft"
            ? "Draft agreement, not yet funded."
            : "No bonus loaded.";

  return (
    <article
      className={`cert${impact ? " is-impact" : ""}${dimmed ? " is-dimmed" : ""}`}
      data-s={state}
      data-seal={sealed ? "on" : "off"}
      aria-label={`Bonus certificate. ${amount}${unloaded ? "" : ` in ${stockName ?? "-"} stock`}. ${status}.`}
    >
      <div className="f1">
        <div>
          <span className="band" />

          <div className="draft-ribbon">Draft, not yet funded</div>

          <header className="ch">
            <span className="i">Equity Benefit Wallet</span>
            <span className="r ref" key={referenceText}>
              {referenceText}
            </span>
          </header>

          <p className="amt">
            {unloaded ? "$0" : amount}
            <small>{subLine}</small>
          </p>

          <dl className="rows">
            <div>
              <dt>For</dt>
              <dd>{unloaded ? dash : (milestone ?? dash)}</dd>
            </div>
            <div>
              <dt>Release date</dt>
              <dd>{unloaded ? dash : (releaseDate ?? dash)}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd className={state === "released" || state === "claimed" ? "is-unlocked" : undefined}>{status}</dd>
            </div>
            <div>
              <dt>Delivered to</dt>
              <dd>{delivered}</dd>
            </div>
          </dl>

          {releaseDate && <Strap releaseDate={releaseDate} />}
        </div>
      </div>

      <Seal sealed={sealed} label={state === "claimed" ? "Claimed" : "Unlocked"} />

      <p className="sr-only" role="status">
        {announcement}
      </p>
    </article>
  );
}
