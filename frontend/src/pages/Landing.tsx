import { useState, type ReactNode } from "react";
import { Certificate } from "../components/Certificate";
import { DeskShell } from "../components/DeskShell";
import { Footer } from "../components/Footer";
import { Notice } from "../components/Notice";
import { StateSwitcher, type PreviewState } from "../components/StateSwitcher";
import { useInView } from "../hooks/useInView";

/* The hero certificate is a specimen, and says so. It carries the approved
   mockup's figures — nothing here is read from chain. */
const SPECIMEN = {
  amount: "$2,500",
  stockName: "Apple-linked",
  recipient: "Dayo Adeyemi",
  milestone: "Shipping the Robinhood Chain integration",
  releaseDate: "15 October 2026",
  reference: "0042",
  deliveredTo: "Dayo Adeyemi, by the employer"
};

export function Landing({ navigate, header }: { navigate: (to: string) => void; header: ReactNode }) {
  const [preview, setPreview] = useState<PreviewState>("held");
  const [lineRef, lineIn] = useInView<HTMLDivElement>();
  const [forkRef, forkIn] = useInView<HTMLDivElement>();
  const [trustRef, trustIn] = useInView<HTMLElement>();

  return (
    <>
      <DeskShell header={header}>
        <div className="hero">
          <div>
            <h1>
              <span className="hl hl1">Paid in stock.</span>
              <span className="hl hl2">Released by the work,</span>
              <span className="hl hl3">
                <em>or by the calendar.</em>
              </span>
            </h1>

            <p className="lede">
              An employer locks a stock bonus in a contract. They release it when the job is done. If they go quiet, the
              contractor claims it on the deadline.
            </p>

            <div className="cta">
              <button className="btn btn-light" onClick={() => navigate("/employer/fund")}>
                Give a bonus
              </button>
              <button className="lnk" onClick={() => navigate("/contractor/grant")}>
                Claim your bonus
              </button>
            </div>
          </div>

          <div className="stage">
            <Certificate state={preview} {...SPECIMEN} />
            <StateSwitcher value={preview} onChange={setPreview} />
            <p className="specimen-cap">A specimen. Nothing here is issued.</p>
          </div>
        </div>

        <Notice />
      </DeskShell>

      <section className="story" aria-labelledby="timeline-title">
        <div className="wrap">
          <h2 id="timeline-title">One bonus, and only two ways it ends.</h2>
          <p className="sub">
            Every bonus follows the same path. The date is fixed the moment it is funded, and nobody can move it.
          </p>

          <div className={`timeline-track${lineIn ? " is-in" : ""}`} ref={lineRef}>
            <div className="stop">
              <span className="d">Day one</span>
              <h3>Funded and held.</h3>
              <p>The employer picks the stock and the deadline. The contract holds it. Nobody can pull it back.</p>
            </div>
            <div className="stop">
              <span className="d">Any day before the deadline</span>
              <h3>The work is done.</h3>
              <p>The employer confirms, and the stock goes straight to the contractor's own wallet.</p>
            </div>
            <div className="stop dl">
              <span className="d">The date you set</span>
              <h3>The deadline.</h3>
              <p>Still not released? The bonus becomes claimable. No lawyer, no dispute.</p>
            </div>
          </div>

          <div className={`fork${forkIn ? " is-in" : ""}`} ref={forkRef}>
            <div>
              <b>Employer releases</b>
              <p>One transaction, before the date. The certificate is stamped and the stock is delivered.</p>
            </div>
            <div>
              <b>Contractor claims it themselves</b>
              <p>One transaction, on or after the date. The certificate reads "Claimed automatically."</p>
            </div>
          </div>
        </div>
      </section>

      <section className={`trust${trustIn ? " is-in" : ""}`} ref={trustRef}>
        <div className="wrap">
          <blockquote>
            No trust required. A contract holds it, <em>not a company, not an app.</em>
          </blockquote>
          <p>
            Your bonus isn't held by a company or an app. A contract holds it. If your employer goes quiet, you can claim
            it yourself, automatically, on the date shown above — no lawyer, no waiting on goodwill.
          </p>
        </div>
      </section>

      <Footer />
    </>
  );
}
