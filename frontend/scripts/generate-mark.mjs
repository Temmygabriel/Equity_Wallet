// Generates frontend/public/favicon.svg — the browser tab icon.
//
// The mark is the certificate seal's guilloché rosette (components/Rosette.tsx), reduced
// to what survives a 16px tab: one ring and one six-lobed rosette, drawn heavy. The
// certificate's version is five concentric twelve-lobed curves at ~120px, which turns to
// mush when shrunk.
//
// The same geometry is drawn in components/Mark.tsx for the header. If one changes, the
// other must: they are deliberately not shared, because this is a Node script and that is
// a component, and a generated component is harder to read than a duplicated constant.
//
//   node scripts/generate-mark.mjs public/favicon.svg
import { writeFileSync } from "node:fs";

export const GEOMETRY = {
  ring: { radius: 14.6, width: 1.35 },
  rosette: { radius: 9.8, amplitude: 1.9, lobes: 6, width: 1.8, samples: 360 }
};

export function rosettePath({ radius, amplitude, lobes, samples }, centre = 16) {
  let d = "";
  for (let i = 0; i <= samples; i += 1) {
    const t = (i / samples) * Math.PI * 2;
    const r = radius + amplitude * Math.cos(lobes * t);
    d += `${i ? "L" : "M"}${(centre + r * Math.cos(t)).toFixed(2)} ${(centre + r * Math.sin(t)).toFixed(2)}`;
  }
  return `${d}Z`;
}

if (process.argv[2]) {
  const { ring, rosette } = GEOMETRY;
  /* Two colours, because a browser tab can be light or dark, and this is the one piece
     of the product that is drawn outside the stylesheet's control. */
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" role="img" aria-label="Equity Benefit Wallet">
  <style>
    .m { stroke: #0e1830; }
    @media (prefers-color-scheme: dark) { .m { stroke: #e8dcc0; } }
  </style>
  <g fill="none" stroke-linejoin="round">
    <circle class="m" cx="16" cy="16" r="${ring.radius}" stroke-width="${ring.width}"/>
    <path class="m" d="${rosettePath(rosette)}" stroke-width="${rosette.width}"/>
  </g>
</svg>
`;
  writeFileSync(process.argv[2], svg);
  console.log(`wrote ${process.argv[2]}`);
}
