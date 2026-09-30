import { Notice } from "../components/Notice";
import type { AccountView } from "../hooks/useAccount";

type ContractorGrantProps = { grantId?: string; account: AccountView };

/* Checkpoint 1 placeholder: the desk surface for the payoff screen. The
   certificate, role-aware actions and adapter read land in checkpoint 5. */
export function ContractorGrant({ grantId }: ContractorGrantProps) {
  return (
    <main className="desk">
      <section className="wrap">
        <h1>Your bonus.</h1>
        <p>{grantId ? `Bonus ${grantId}` : "Enter your bonus number."}</p>
      </section>
      <Notice surface="desk" />
    </main>
  );
}
