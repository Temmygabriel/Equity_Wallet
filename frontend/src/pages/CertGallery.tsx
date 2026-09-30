import { Certificate, type CertState } from "../components/Certificate";

/* TEMPORARY verification route (spec checkpoint 2). Not part of the product and
   removed before the final commit. Renders all five certificate states side by
   side so they can be compared in one view. */
const STATES: { state: CertState; note: string }[] = [
  { state: "draft", note: "Employer preview. Dashed ribbon, dimmed figures, no seal." },
  { state: "held", note: "Strap across the certificate. No seal. The strap is the lock." },
  { state: "released", note: "Strap slid away, seal stamped, status green." },
  { state: "claimed", note: "Seal reads Claimed. Delivered-to is a feature, not a footnote." },
  { state: "unloaded", note: "Nothing loaded. Whole certificate at 45%." }
];

export function CertGallery() {
  return (
    <main className="wrap" style={{ padding: "48px 0 120px" }}>
      <h1>Temporary: certificate states</h1>
      <div style={{ display: "grid", gap: "56px", marginTop: "40px" }}>
        {STATES.map(({ state, note }) => (
          <section key={state}>
            <h2 style={{ fontSize: 24 }}>{state}</h2>
            <p style={{ fontSize: 13, color: "var(--ink-soft)", margin: "4px 0 16px" }}>{note}</p>
            <div style={{ background: "var(--desk)", padding: "48px 40px", display: "flex", justifyContent: "center" }}>
              <Certificate
                state={state}
                amount="$2,500"
                stockName="Apple-linked"
                recipient="Dayo Adeyemi"
                milestone="Shipping the Robinhood Chain integration"
                releaseDate="15 October 2026"
                reference="0042"
                deliveredTo="Dayo Adeyemi, by the employer"
                dimmed={state === "draft"}
              />
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
