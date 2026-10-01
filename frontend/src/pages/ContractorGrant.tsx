import { useCallback, useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { chainAdapter, explorerContractUrl, type DemoGrant } from "../chainAdapter";
import { Certificate, type CertState } from "../components/Certificate";
import { DeskShell } from "../components/DeskShell";
import { IconAlert } from "../components/icons";
import { JurisdictionGate } from "../components/JurisdictionGate";
import { Notice } from "../components/Notice";
import { stockLabel } from "../components/StockPicker";
import type { AccountView } from "../hooks/useAccount";
import type { Jurisdiction } from "../hooks/useJurisdiction";
import { certAmount } from "../amount";

/* The certificate entrance of §5.1 starts at 200ms and runs 900ms, and §11.1
   wants the on-load stamp to start 500ms after it lands. */
const ON_LOAD_STAMP_MS = 1600;

const COUNTDOWN_WINDOW_MS = 30 * 86_400_000;
const DAY_MS = 86_400_000;
const HOUR_MS = 3_600_000;

const NOT_A_NUMBER = "That isn't a bonus number. Use the number from the link you were sent.";

/* Read from the onchain deadline, computed at render. There is no ticking
   timer, and never a count of seconds (§11.2). */
function countdownText(deadlineTimestamp: number): string | undefined {
  const msLeft = deadlineTimestamp * 1000 - Date.now();
  if (msLeft <= 0 || msLeft >= COUNTDOWN_WINDOW_MS) return undefined;
  if (msLeft < DAY_MS) {
    const hours = Math.max(1, Math.ceil(msLeft / HOUR_MS));
    return `${hours} ${hours === 1 ? "hour" : "hours"} until you can claim it yourself`;
  }
  const days = Math.ceil(msLeft / DAY_MS);
  return `${days} ${days === 1 ? "day" : "days"} until you can claim it yourself`;
}

function describeError(reason: unknown): string {
  const message = reason instanceof Error ? reason.message : "";
  const code = (reason as { code?: number } | null)?.code;
  if (code === 4001 || /user (rejected|denied)|declined/i.test(message)) {
    return "The wallet declined the request. Nothing changed.";
  }
  if (/switch your wallet/i.test(message)) return "Switch your wallet to Robinhood Chain Testnet (46630).";
  const firstLine = message.split("\n")[0]?.trim();
  return firstLine ? firstLine : "The request failed.";
}

type ContractorGrantProps = {
  header: ReactNode;
  grantId?: string;
  account: AccountView;
  jurisdiction: Jurisdiction;
  onHome: () => void;
  navigate: (to: string) => void;
};

export function ContractorGrant({ header, grantId, account, jurisdiction, onHome, navigate }: ContractorGrantProps) {
  const [grant, setGrant] = useState<DemoGrant>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState<"release" | "claim">();
  const [entry, setEntry] = useState("");
  /* Reading a certificate is free, so the jurisdiction gate is not in front of it. It is
     raised on the click that would actually move funds (§25). */
  const [gateAsked, setGateAsked] = useState(false);
  /* Latched when a grant arrives, so an unrelated re-render cannot cancel the
     one on-load stamp §11.1 allows. Stays 0 for every load after an action. */
  const arrivalDelay = useRef(0);

  const load = useCallback(async (id: string, arrival = false) => {
    if (!/^\d+$/.test(id)) {
      setGrant(undefined);
      setLoading(false);
      setError(NOT_A_NUMBER);
      return;
    }
    setLoading(true);
    setError(undefined);
    try {
      const loaded = await chainAdapter.getGrant(BigInt(id));
      if (arrival) arrivalDelay.current = loaded.state === "LOCKED" ? 0 : ON_LOAD_STAMP_MS;
      setGrant(loaded);
    } catch (reason) {
      /* Never leave the previous ID's data on screen (§11.1). */
      setGrant(undefined);
      setError(reason instanceof Error ? reason.message : "Could not read that bonus.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setGrant(undefined);
    setError(undefined);
    arrivalDelay.current = 0;
    if (grantId) void load(grantId, true);
  }, [grantId, load]);

  const act = async (kind: "release" | "claim") => {
    if (busy || !grantId) return;
    setBusy(kind);
    setError(undefined);
    try {
      if (kind === "release") await chainAdapter.releaseGrant(BigInt(grantId));
      else await chainAdapter.claimAfterTimeout(BigInt(grantId));
      await load(grantId);
    } catch (reason) {
      setError(describeError(reason));
    } finally {
      setBusy(undefined);
    }
  };

  const openCertificate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = entry.trim();
    if (value === "") return;
    navigate(`/contractor/grant?id=${value}`);
  };

  const state: CertState = !grant
    ? "unloaded"
    : grant.state === "LOCKED"
      ? "held"
      : grant.releasedBy === "timeout"
        ? "claimed"
        : "released";

  /* The milestone and the agreed amount are read from the contract. They used to be looked
     up in this browser's localStorage, which meant the certificate lost them the moment it
     was opened anywhere else — a different device, a private window, or after clearing site
     data. There is no fallback now because there is nothing left to fall back to. */
  const milestone = grant?.milestone;

  const money = grant ? certAmount(grant.usdgAmount, grant.stockAmount, stockLabel(grant.stock)) : undefined;
  const amount = money?.amount ?? "$0";
  const subLine = money?.subLine;

  const deliveredTo =
    grant?.releasedBy === "timeout"
      ? "Claimed automatically"
      : grant?.releasedBy === "employer"
        ? `${grant.contractor}, by the employer`
        : grant?.contractor;

  const me = account.address?.toLowerCase();
  const isEmployer = Boolean(me && grant?.employerAddress && grant.employerAddress.toLowerCase() === me);
  const isContractor = Boolean(me && grant?.contractorAddress && grant.contractorAddress.toLowerCase() === me);
  const held = grant?.state === "LOCKED";
  const deadlinePassed = grant ? grant.deadlineTimestamp * 1000 <= Date.now() : false;

  /* §11.2: absent button plus explanatory text, never a disabled button, and
     never more than one primary action. */
  const canRelease = held && isEmployer && !deadlinePassed;
  const canClaim = held && isContractor && deadlinePassed;

  /* Only the two actions are gated. Reading is not. */
  const gateOpen = (canRelease || canClaim) && gateAsked && jurisdiction.status !== "passed";
  const actThroughGate = (kind: "release" | "claim") => {
    if (jurisdiction.status === "passed") void act(kind);
    else setGateAsked(true);
  };

  const countdown = held && isContractor && grant ? countdownText(grant.deadlineTimestamp) : undefined;

  const arrivalStamp = arrivalDelay.current > 0 && (state === "released" || state === "claimed");
  const actionLabel = canRelease
    ? busy === "release"
      ? "Releasing…"
      : "Release now"
    : busy === "claim"
      ? "Claiming…"
      : "Claim it yourself";

  let context: ReactNode = null;
  if (grant && held && isContractor) {
    context = (
      <>
        {milestone && <p>Unlocks when: {milestone}</p>}
        <p>If it isn't released by then, it's automatically yours on {grant.deadline}.</p>
        {countdown && <p className="payoff-quiet">{countdown}</p>}
      </>
    );
  } else if (grant && held && isEmployer) {
    context = <p>{deadlinePassed ? "The deadline has passed. The contractor can now claim it." : `The contractor can claim it themselves from ${grant.deadline}.`}</p>;
  } else if (grant && !held && isContractor) {
    context = (
      <p className="payoff-strong">
        {grant.releasedBy === "timeout"
          ? "You claimed this yourself. No one had to approve it."
          : "Your employer released this bonus. It's in your wallet."}
      </p>
    );
  } else if (grant && !isEmployer && !isContractor) {
    context = (
      <p>
        Connect the employer's or contractor's wallet to act on this bonus.{" "}
        <button className="lnk" onClick={() => void account.connect()}>
          Connect wallet
        </button>
      </p>
    );
  }

  return (
    <>
      <DeskShell header={header}>
      <div className="payoff">
        <div className="payoff-stage">
          {/* While reading, the certificate is a blank placeholder at 45%: the
              "Enter your bonus number" line belongs to the no-id state only. */}
          <Certificate
            state={state}
            amount={amount}
            stockName={grant ? stockLabel(grant.stock) : undefined}
            recipient={grant ? grant.contractor : undefined}
            milestone={milestone}
            releaseDate={grant?.deadline}
            reference={grantId?.padStart(4, "0")}
            deliveredTo={deliveredTo}
            stampDelayMs={arrivalStamp ? ON_LOAD_STAMP_MS : 0}
            statusText={loading ? "Reading…" : undefined}
            subLine={loading ? "" : subLine}
          />
        </div>

        {grantId === undefined ? (
          <form className="payoff-actions" onSubmit={openCertificate}>
            <div className="field payoff-field">
              <label htmlFor="bonus-number">Bonus number</label>
              <input
                id="bonus-number"
                inputMode="numeric"
                autoComplete="off"
                value={entry}
                onChange={(event) => setEntry(event.target.value)}
              />
            </div>
            <button className="btn btn-light" type="submit">
              Open certificate
            </button>
          </form>
        ) : (
          <>
            {context && <div className="payoff-context">{context}</div>}

            {(canRelease || canClaim) && (
              <div className="payoff-actions">
                <button
                  className={`btn btn-light${busy ? " is-busy" : ""}`}
                  type="button"
                  aria-busy={busy ? true : undefined}
                  onClick={() => actThroughGate(canRelease ? "release" : "claim")}
                >
                  {actionLabel}
                </button>
              </div>
            )}

            {/* Evidence, not a product surface, so it stays quieter than the
                certificate it belongs to (§23). */}
            {grant && (
              <a className="payoff-onchain" href={explorerContractUrl()} target="_blank" rel="noreferrer">
                View onchain
              </a>
            )}
          </>
        )}

        {error && (
          <p className="form-error" role="alert">
            <IconAlert size={16} />
            {error}
          </p>
        )}
      </div>

      <Notice />
      </DeskShell>

      {gateOpen && (
        <JurisdictionGate
          status={jurisdiction.status}
          region={jurisdiction.region}
          onChoose={jurisdiction.choose}
          onReset={jurisdiction.reset}
          onHome={onHome}
        />
      )}
    </>
  );
}
