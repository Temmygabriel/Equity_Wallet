import type { ReactNode } from "react";
import { DeskShell } from "../components/DeskShell";
import { Notice } from "../components/Notice";
import type { AccountView } from "../hooks/useAccount";

type ContractorGrantProps = { header: ReactNode; grantId?: string; account: AccountView };

/* Checkpoint 3 placeholder: the desk surface for the payoff screen. The
   certificate, role-aware actions and adapter read land in checkpoint 5. */
export function ContractorGrant({ header, grantId }: ContractorGrantProps) {
  return (
    <DeskShell header={header}>
      <div className="hero">
        <div>
          <h1>{grantId ? `Bonus ${grantId}` : "Enter your bonus number."}</h1>
        </div>
      </div>
      <Notice />
    </DeskShell>
  );
}
