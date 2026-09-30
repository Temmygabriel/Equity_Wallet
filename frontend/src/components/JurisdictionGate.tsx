import { useEffect, useRef, useState } from "react";
import { GATE_REGIONS } from "../config/jurisdiction";
import type { GateStatus } from "../hooks/useJurisdiction";

type JurisdictionGateProps = {
  status: GateStatus;
  region?: string;
  onChoose: (region: string) => void;
  onReset: () => void;
  onHome: () => void;
};

/* Required verbatim label (spec §6A.2). Always visible, in every gate state. */
const DEMO_LABEL =
  "Demo-only check. This is a placeholder on the frontend, not a real compliance control. It verifies nothing.";

/* The leaving animation, in milliseconds. Matches the CSS in forms.css. */
const LEAVE_MS = 200;

/* On a direct load there is no trigger to return focus to, so the page heading
   takes it instead. */
function focusHeading() {
  const heading = document.querySelector<HTMLElement>("h1");
  if (!heading) return;
  heading.setAttribute("tabindex", "-1");
  heading.focus();
  heading.addEventListener("blur", () => heading.removeAttribute("tabindex"), { once: true });
}

/* A demo-only jurisdiction gate. It appears on the three gated routes, and is
   deliberately not dismissible: there is no close button and Esc does nothing.
   The only ways out are choosing a region or leaving for the homepage. */
export function JurisdictionGate({ status, region, onChoose, onReset, onHome }: JurisdictionGateProps) {
  const [choice, setChoice] = useState("");
  const [leaving, setLeaving] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const selectRef = useRef<HTMLSelectElement>(null);
  const blocked = status === "blocked";

  /* The page behind is inert, so Tab must cycle inside the sheet. */
  useEffect(() => {
    const trigger = document.activeElement as HTMLElement | null;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Tab" || !sheetRef.current) return;
      const focusable = sheetRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), select:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      /* One frame later, so the background has shed its inert attribute. */
      window.requestAnimationFrame(() => {
        if (trigger && trigger.isConnected && trigger !== document.body) trigger.focus();
        else focusHeading();
      });
    };
  }, []);

  /* Focus follows the sheet's contents: the select while asking, the first
     action once the answer is blocked. */
  useEffect(() => {
    if (blocked) sheetRef.current?.querySelector<HTMLElement>("a[href], button")?.focus();
    else selectRef.current?.focus();
  }, [blocked]);

  const confirm = () => {
    if (!choice || leaving) return;
    /* Let the sheet leave before the route content arrives behind it. */
    setLeaving(true);
    window.setTimeout(() => onChoose(choice), LEAVE_MS);
  };

  return (
    <div
      className={`gate${leaving ? " is-leaving" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="gate-title"
    >
      <div className="gate-backdrop" />

      <div className="gate-sheet" ref={sheetRef}>
        {blocked ? (
          <div className="gate-body" key="blocked">
            <h2 id="gate-title">This demo isn't available in {region}.</h2>
            <p className="gate-copy">
              Nothing has been checked or recorded beyond your choice. You can still read how it works on the homepage.
            </p>
            <div className="gate-actions">
              <button className="btn btn-ink" onClick={onHome}>
                Back to the homepage
              </button>
              <button className="text-action" onClick={onReset}>
                Choose a different region
              </button>
            </div>
            <p className="gate-label">{DEMO_LABEL}</p>
          </div>
        ) : (
          <div className="gate-body" key="ask">
            <h2 id="gate-title">Before you continue.</h2>
            <p className="gate-copy">
              Confirm where you're based. Some places may not be able to use this demo.
            </p>

            <div className="field">
              <label htmlFor="gate-region">Country or region</label>
              <select
                id="gate-region"
                ref={selectRef}
                value={choice}
                onChange={(event) => setChoice(event.target.value)}
              >
                <option value="" disabled>
                  Choose one
                </option>
                {GATE_REGIONS.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
                <option value="Somewhere else">Somewhere else</option>
              </select>
            </div>

            {!choice && <p className="gate-helper">Choose your country or region to go on.</p>}

            <div className="gate-actions">
              <button className="btn btn-ink" aria-disabled={choice ? undefined : true} onClick={confirm}>
                Confirm location
              </button>
              <button className="text-action" onClick={onHome}>
                Back to the homepage
              </button>
            </div>

            <p className="gate-label">{DEMO_LABEL}</p>
          </div>
        )}
      </div>
    </div>
  );
}
