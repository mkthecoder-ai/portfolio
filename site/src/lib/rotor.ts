// The turbine rotor, shared by the hero (SVG) and the living background (canvas): three tapered blades and the
// hub as ONE closed outline, in units of the blade length, pivoting at the hub centre (0, 0). One outline means
// one fill and one stroke, so the blades can't separate from the hub, and translucent fills never double up at
// the joins. Rotate the whole outline as one rigid body; never the blades on their own.
type Pt = readonly [number, number];

export const BLADES = 3;
/** Hub radius, as a fraction of the blade length (about the size of the painted spinner noses). */
export const HUB_R = 0.075;

// Blade profile along the span s (0 = hub centre, 1 = tip): half-widths on the leading side (+y, the side that
// moves first when the rotor turns clockwise on screen) and on the trailing side (-y). The trailing edge carries
// the chord bulge near the root; both taper to a narrow tip.
const ROOT: [lead: number, trail: number] = [0.026, 0.03];
const PROFILE: [s: number, lead: number, trail: number][] = [
  [0.14, 0.03, 0.04], [0.24, 0.03, 0.05], [0.38, 0.026, 0.04], [0.55, 0.02, 0.028],
  [0.75, 0.014, 0.018], [0.9, 0.009, 0.011], [0.97, 0.006, 0.006],
];
const ARC_STEPS = 8;

const rot = ([x, y]: Pt, a: number): Pt => [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)];

export interface Rotor { outline: Pt[]; tips: Pt[]; rims: Pt[][]; chord: { s: number; w: number }[] }

/** The rotor outline, turned `deg` clockwise (on screen) from rest, where the first blade points straight up. */
export function rotor(deg = 0): Rotor {
  const base = ((deg - 90) * Math.PI) / 180;
  const step = (2 * Math.PI) / BLADES;
  const tLead = Math.asin(ROOT[0] / HUB_R), tTrail = Math.asin(ROOT[1] / HUB_R);
  const onHub = (a: number): Pt => [HUB_R * Math.cos(a), HUB_R * Math.sin(a)];
  // One blade in its own frame (along +x): trailing root on the hub, out along the trailing edge, round the tip,
  // back along the leading edge to the leading root on the hub.
  const trail: Pt[] = [onHub(-tTrail), ...PROFILE.map(([s, , t]) => [s, -t] as Pt)];
  const lead: Pt[] = [...PROFILE.map(([s, l]) => [s, l] as Pt).reverse(), onHub(tLead)];
  const blade: Pt[] = [...trail, [1, 0], ...lead];
  // Hub arc from this blade's leading root to the next blade's trailing root (exclusive at both ends).
  const arc: Pt[] = Array.from({ length: ARC_STEPS }, (_, i) => onHub(tLead + ((step - tLead - tTrail) * (i + 1)) / (ARC_STEPS + 1)));

  const outline: Pt[] = [], tips: Pt[] = [], rims: Pt[][] = [];
  for (let k = 0; k < BLADES; k++) {
    const a = base + k * step;
    outline.push(...[...blade, ...arc].map((p) => rot(p, a)));
    tips.push(rot([1, 0], a));
    rims.push(trail.map((p) => rot(p, a)));
  }
  const chord = [{ s: HUB_R, w: ROOT[0] + ROOT[1] }, ...PROFILE.map(([s, l, t]) => ({ s, w: l + t }))];
  return { outline, tips, rims, chord };
}

const fmt = (n: number, L: number) => String(+n.toFixed(L < 10 ? 4 : 1));
const pts = (ps: Pt[], L: number, cx: number, cy: number) => ps.map(([x, y]) => `${fmt(cx + x * L, L)} ${fmt(cy + y * L, L)}`);

/** SVG path data for the whole rotor (one closed subpath), with blade length L and the hub at (cx, cy). */
export function rotorPath(L: number, cx = 0, cy = 0): string {
  const [first, ...rest] = pts(rotor().outline, L, cx, cy);
  return `M${first} L${rest.join(" L")} Z`;
}

/** SVG path data for a thin highlight along each blade's trailing edge (the rim light in the hero). */
export function rimPath(L: number, cx = 0, cy = 0): string {
  return rotor().rims.map((r) => { const [first, ...rest] = pts(r, L, cx, cy); return `M${first} L${rest.join(" L")}`; }).join(" ");
}
