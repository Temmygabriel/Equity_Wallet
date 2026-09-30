import { useEffect, useState, type FormEvent } from "react";
import { chainAdapter, type DemoGrant } from "../chainAdapter";
import { stockLabel } from "../components/StockPicker";
import { certAmount, readRegister } from "../local";

/* A row is either read, still being read, or unreadable. There is no fourth
   state, and a row that says "Reading…" forever is a bug (§9). */
type Row = DemoGrant | "unreadable";

function statusText(grant: DemoGrant): string {
  return grant.state === "LOCKED" ? "Held by the contract" : "Unlocked";
}

export function EmployerGrants({ navigate }: { navigate: (to: string) => void }) {
  const [entry, setEntry] = useState("");
  /* Read once, lazily, so the list is on screen on first paint. */
  const [ids] = useState<string[]>(readRegister);
  const [rows, setRows] = useState<Record<string, Row>>({});

  /* Status comes from the chain, so it is fetched lazily, one grant at a time.
     The contract cannot list grants by employer, which is why this list is the
     browser's own record and not a contract query. */
  useEffect(() => {
    const pending = ids.filter((id) => /^\d+$/.test(id) && !(id in rows));
    if (pending.length === 0) return;
    let cancelled = false;
    void Promise.all(
      pending.map(async (id): Promise<[string, Row]> => {
        try {
          return [id, await chainAdapter.getGrant(BigInt(id))];
        } catch {
          return [id, "unreadable"];
        }
      })
    ).then((entries) => {
      if (!cancelled) setRows((current) => ({ ...current, ...Object.fromEntries(entries) }));
    });
    return () => {
      cancelled = true;
    };
  }, [ids, rows]);

  /* A stored entry that is not a number can never be read, so it resolves at
     once rather than sitting at "Reading…". */
  const rowFor = (id: string): Row | undefined => (/^\d+$/.test(id) ? rows[id] : "unreadable");

  const open = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = entry.trim();
    if (value === "") return;
    navigate(`/contractor/grant?id=${value}`);
  };

  return (
    <main className="wrap register">
      <div className="register-head">
        <h1>Your bonuses.</h1>
        <p>Open any bonus by its number to see the certificate the contractor sees.</p>
      </div>

      <form className="register-lookup" onSubmit={open}>
        <div className="field">
          <label htmlFor="bonus-number">Bonus number</label>
          <input
            id="bonus-number"
            inputMode="numeric"
            autoComplete="off"
            required
            value={entry}
            onChange={(event) => setEntry(event.target.value)}
          />
        </div>
        <button className="btn btn-ink" type="submit">
          Open certificate
        </button>
      </form>

      <section className="register-list">
        <h2>Funded from this browser</h2>

        {ids.length === 0 ? (
          <p className="register-empty">
            No bonuses yet. Your first one takes about two minutes.{" "}
            <button className="lnk" type="button" onClick={() => navigate("/employer/fund")}>
              Give a bonus
            </button>
          </p>
        ) : (
          <>
            <ul className="strips">
              {ids.map((id) => {
                const row = rowFor(id);
                const reading = row === undefined;
                const broken = row === "unreadable";
                const grant = typeof row === "object" ? row : undefined;
                const money = grant ? certAmount(id, grant.stockAmount, stockLabel(grant.stock)) : undefined;

                return (
                  <li key={id}>
                    <button
                      className={`strip${reading ? " is-reading" : ""}`}
                      type="button"
                      onClick={() => navigate(`/contractor/grant?id=${id}`)}
                    >
                      <span className="strip-lead">
                        <span className="strip-amount">
                          {broken ? "-" : reading ? "Reading…" : money?.amount}
                        </span>
                        {grant && (
                          <span className="strip-meta">
                            <span>{stockLabel(grant.stock)}</span>
                            <span>{grant.deadline}</span>
                          </span>
                        )}
                        {broken && <span className="strip-meta">Not readable right now.</span>}
                      </span>

                      <span className="strip-tail">
                        <span className="strip-status">{grant ? statusText(grant) : ""}</span>
                        <span className="strip-ref">Grant {id.padStart(4, "0")}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>

            <p className="register-cap">
              Only bonuses funded from this browser appear here. The contract can't list bonuses by employer, so any
              other bonus opens by its number.
            </p>
          </>
        )}
      </section>
    </main>
  );
}
