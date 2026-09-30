import { useState } from "react";

export type PreviewState = "held" | "released" | "claimed";

const OPTIONS: { id: PreviewState; label: string }[] = [
  { id: "held", label: "Held" },
  { id: "released", label: "Employer releases" },
  { id: "claimed", label: "Contractor claims" }
];

/* A real group of toggle buttons. "Employer releases" carries a one-time drawn
   underline at 2.5s inviting the click; it retires once the group is used. */
export function StateSwitcher({
  value,
  onChange
}: {
  value: PreviewState;
  onChange: (next: PreviewState) => void;
}) {
  const [touched, setTouched] = useState(false);

  return (
    <div className="states" role="group" aria-label="Preview the certificate states" data-touched={touched}>
      {OPTIONS.map((option) => (
        <button
          key={option.id}
          type="button"
          aria-pressed={value === option.id}
          className={option.id === "released" ? "hint" : undefined}
          onClick={() => {
            setTouched(true);
            onChange(option.id);
          }}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
