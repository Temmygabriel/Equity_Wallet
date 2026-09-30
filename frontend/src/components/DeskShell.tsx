import type { ReactNode } from "react";

/* Desk pages place the header inside their own full-viewport surface so the
   light pool and the grain run behind it, and so the testnet notice can sit
   against the bottom of the hero rather than the bottom of the document. */
export function DeskShell({ header, children }: { header: ReactNode; children: ReactNode }) {
  return (
    <div className="desk">
      {header}
      {children}
    </div>
  );
}
