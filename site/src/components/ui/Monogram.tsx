/**
 * The MK monogram, the v1 hero visual (spec 3.2). Decorative: the h1 carries the name.
 * Strokes are non-scaling, so they stay 1px from 96px to full size.
 */
export function Monogram({ initials, className }: { initials: string; className?: string }) {
  const ticks = ["M28 64V28h36", "M336 28h36v36", "M372 336v36h-36", "M64 372H28v-36"];
  return (
    <svg viewBox="0 0 400 400" className={className} aria-hidden="true" focusable="false">
      <rect className="mark-frame" x="0.5" y="0.5" width="399" height="399" rx="4" vectorEffect="non-scaling-stroke" />
      {ticks.map((d) => <path key={d} className="mark-line" d={d} vectorEffect="non-scaling-stroke" />)}
      <circle className="mark-line" cx="200" cy="200" r="128" vectorEffect="non-scaling-stroke" />
      {/* Baseline = centre + half the Geist Mono cap height (0.71em), so the capitals sit optically centred. */}
      <text className="mark-letters" x="200" y="240" textAnchor="middle">{initials}</text>
    </svg>
  );
}
