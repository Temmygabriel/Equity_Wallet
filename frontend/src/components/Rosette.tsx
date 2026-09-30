/* The rosette generator, ported verbatim from the mockup: five concentric
   closed curves, r = 40 + a*cos(12t) with a = 3 + k*1.6. Built once at module
   scope rather than per render. Decorative only — it sits inside the seal and
   is never drawn behind text. */
const ROSETTE_PATHS: readonly string[] = (() => {
  const paths: string[] = [];
  const samples = 240;

  for (let k = 0; k < 5; k += 1) {
    const amplitude = 3 + k * 1.6;
    let d = "";
    for (let i = 0; i <= samples; i += 1) {
      const t = (i / samples) * 6.2832;
      const radius = 40 + amplitude * Math.cos(12 * t);
      d += `${i ? "L" : "M"}${(radius * Math.cos(t)).toFixed(1)} ${(radius * Math.sin(t)).toFixed(1)}`;
    }
    paths.push(`${d}Z`);
  }

  return paths;
})();

export function Rosette() {
  return (
    <svg className="rosette" viewBox="-60 -60 120 120" aria-hidden="true">
      {ROSETTE_PATHS.map((d, index) => (
        /* currentColor, so the engraving colour lives once, on .seal in
           certificate.css, and not again here. */
        <path key={index} d={d} fill="none" stroke="currentColor" strokeWidth={0.5} vectorEffect="non-scaling-stroke" />
      ))}
    </svg>
  );
}
