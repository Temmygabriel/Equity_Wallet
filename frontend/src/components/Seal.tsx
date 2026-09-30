import { Rosette } from "./Rosette";

/* The seal is a physical object, so it carries a shadow and a rotation. It is
   always mounted; the certificate's data-seal attribute drives it in and out,
   which is what makes the reverse (preview) direction animate at all. */
export function Seal({ sealed, label }: { sealed: boolean; label: string }) {
  return (
    <div className="seal" data-sealed={sealed ? "on" : "off"} aria-hidden="true">
      <Rosette />
      <span>{label}</span>
    </div>
  );
}
