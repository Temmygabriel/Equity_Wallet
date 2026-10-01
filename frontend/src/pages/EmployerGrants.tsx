import { useEffect, useState, type FormEvent } from "react";
import { chainAdapter, type DemoGrant } from "../chainAdapter";
import { stockLabel } from "../components/StockPicker";
import type { AccountView } from "../hooks/useAccount";
import { certAmount } from "../amount";

/* A row is either read, still being read, or unreadable. There is no fourth
   state, and a row that says "Reading…" forever is a bug (§9). */
type Row = DemoGrant | "unreadable";

function statusText(grant: DemoGrant): string {
  return grant.state === "LOCKED" ? "Held by the contract" : "Unlocked";
}

export function EmployerGrants({ navigate, account }: { navigate: (to: string) => void; account: AccountView }) {
  const [entry, setEntry] = useState("");
  /* undefined means "still being read from the chain". */
  const [ids, setIds] = useState<bigint[]>();
  const [rows, setRows] = useState<Record<string, Row>>({});
  const [listError, setListError] = useState<string>();

  const address = account.address;

  /* The list is discovered from GrantCreated logs filtered by the connected account. It used
     to be a register this browser kept, which meant an employer who cleared site data, or
     signed in from another machine, saw an empty page for bonuses that were plainly on
     chain. The contract cannot enumerate grants by employer, but `employer` is indexed, so
     the logs answer the same question and no backend is needed to do it. */
  useEffect(() => {
    setRows({});
    if (!address) {
      setIds([]);
      setListError(undefined);
      return;
    }
    let cancelled = false;
    setIds(undefined);
    setListError(undefined);
    void chainAdapter
      .getGrantsByEmployer(address)
      .then((found) => {
        if (!cancelled) setIds(found);
      })
      .catch(() => {
        if (!cancelled) {
          setIds([]);
          setListError("Couldn't read your bonuses from the chain just now. Try again in a moment.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [address]);

  /* Status always comes from the chain, so it is fetched lazily, one grant at a time. */
  useEffect(() => {
    if (!ids) return;
    const pending = ids.map((id) => id.toString()).filter((id) => !(id in rows));
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
        <h2>Funded by this wallet</h2>

        {!address ? (
          <p className="register-empty">
            Connect the wallet you funded from to list your bonuses.{" "}
            <button className="lnk" type="button" onClick={() => void account.connect()}>
              Connect wallet
            </button>
          </p>
        ) : ids === undefined ? (
          <p className="register-empty">Reading your bonuses from the chain…</p>
        ) : ids.length === 0 ? (
          <p className="register-empty">
            {listError ?? (
              <>
                No bonuses from this wallet yet. Your first one takes about two minutes.{" "}
                <button className="lnk" type="button" onClick={() => navigate("/employer/fund")}>
                  Give a bonus
                </button>
              </>
            )}
          </p>
        ) : (
          <>
            <ul className="strips">
              {ids.map((grantId) => {
                const id = grantId.toString();
                const row = rows[id];
                const stillReading = row === undefined;
                const broken = row === "unreadable";
                const grant = typeof row === "object" ? row : undefined;
                const money = grant ? certAmount(grant.usdgAmount, grant.stockAmount, stockLabel(grant.stock)) : undefined;

                return (
                  <li key={id}>
                    <button
                      className={`strip${stillReading ? " is-reading" : ""}`}
                      type="button"
                      onClick={() => navigate(`/contractor/grant?id=${id}`)}
                    >
                      <span className="strip-lead">
                        <span className="strip-amount">{broken ? "-" : stillReading ? "Reading…" : money?.amount}</span>
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
              Every bonus funded by this wallet, read from the chain. The contract can't list them itself, so the page
              reads its funding events.
            </p>
          </>
        )}
      </section>
    </main>
  );
}
