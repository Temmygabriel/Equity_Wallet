import type { ReactNode } from "react";

/* The complete icon set. Six icons, drawn engraved rather than friendly:
   square caps, mitred joins, 1.5 stroke. Always decorative — the adjacent text
   or the control's own label carries the meaning. */

type IconProps = { size?: number; className?: string };

function Icon({ size = 20, className, children }: IconProps & { children: ReactNode }) {
  return (
    <svg
      className={className}
      viewBox="0 0 20 20"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="square"
      strokeLinejoin="miter"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export function IconCheck(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 10.5 8 14.5 16 6" />
    </Icon>
  );
}

export function IconCopy(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="7" y="7" width="9" height="9" />
      <path d="M4 12V4h8" />
    </Icon>
  );
}

export function IconExternal(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M8 4H4v12h12v-4" />
      <path d="M11 4h5v5" />
      <path d="M16 4 9 11" />
    </Icon>
  );
}

export function IconAlert(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="10" cy="10" r="7" />
      <path d="M10 6v5" />
      <path d="M10 13.5v.5" />
    </Icon>
  );
}

export function IconClose(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M5 5l10 10M15 5 5 15" />
    </Icon>
  );
}

export function IconCalendar(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="3.5" y="4.5" width="13" height="12" />
      <path d="M3.5 8.5h13M7 3v3M13 3v3" />
    </Icon>
  );
}
