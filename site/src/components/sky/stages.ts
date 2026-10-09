// Spec 5.2: the six stages of the living background (day → night → dawn). Pure data and maths, shared by the canvas
// engine and the tests. Stage numbers match data-stage on the page (1 = hero ... 6 = contact + footer).

export interface Stage { id: number; name: string; sky: [string, string, string, string] }

/** Sky stops, top → horizon (at 0, 0.45, 0.8 and 1 of the viewport height). */
export const STAGES: Stage[] = [
  { id: 1, name: "golden dusk", sky: ["#2b2350", "#5a3a78", "#b8607a", "#eea062"] },
  { id: 2, name: "violet twilight", sky: ["#17163d", "#2f2864", "#6a4f92", "#b884a6"] },
  { id: 3, name: "night", sky: ["#04060e", "#091024", "#111a38", "#1a2850"] },
  { id: 4, name: "night over the valley", sky: ["#04060d", "#081021", "#0d1931", "#132342"] },
  { id: 5, name: "pre-dawn", sky: ["#0c0f2e", "#262864", "#5e4787", "#d898ac"] },
  { id: 6, name: "sunrise", sky: ["#26306a", "#5d5796", "#d9957c", "#ffcf8a"] },
];

export type Layer =
  | "stars" | "shooting" | "aurora" | "clouds" | "packets" | "hills" | "turbines" | "valley" | "network" | "sun" | "rider";

/** How present each layer is on each stage (index 0 = stage 1). */
export const WEIGHTS: Record<Layer, readonly number[]> = {
  stars: [0, 0.35, 1, 1, 0.45, 0.1],
  shooting: [0, 0, 1, 0.6, 0, 0],
  aurora: [0, 0, 1, 0.1, 0, 0],
  clouds: [0, 1, 0.12, 0, 0.3, 0.75],
  packets: [0, 0.3, 1, 0.35, 0.2, 0],
  hills: [0, 0, 1, 0, 1, 0],
  turbines: [0, 1, 0, 0, 0, 1],
  valley: [0, 0, 0, 1, 0, 0],
  network: [0, 0, 0, 1, 0, 0],
  sun: [0, 0, 0, 0, 0, 1],
  rider: [0, 0, 0, 0, 0, 1],
};

const smoothstep = (a: number, b: number, x: number) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

/**
 * The continuous stage (1..6) at document position `y`. `bottoms[n]` is where stage n+1 ends; each boundary is
 * crossed over one viewport height `H`, centred on the boundary.
 */
export function stageAt(y: number, bottoms: readonly number[], H: number): number {
  return 1 + bottoms.reduce((s, b) => s + smoothstep(b - H / 2, b + H / 2, y), 0);
}

/** A layer's weight at continuous stage `s`, blended linearly between whole stages. */
export function layerWeight(layer: Layer, s: number): number {
  const w = WEIGHTS[layer];
  const x = Math.min(6, Math.max(1, s)) - 1;
  const i = Math.min(4, Math.floor(x));
  return w[i] + (w[i + 1] - w[i]) * (x - i);
}

const rgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));

export function mixHex(a: string, b: string, t: number): string {
  const [ca, cb] = [rgb(a), rgb(b)];
  return `rgb(${ca.map((v, i) => Math.round(v + (cb[i] - v) * t)).join(",")})`;
}

/** The four sky stops at continuous stage `s`. */
export function skyAt(s: number): string[] {
  const x = Math.min(6, Math.max(1, s)) - 1;
  const i = Math.min(4, Math.floor(x));
  return STAGES[i].sky.map((c, k) => mixHex(c, STAGES[i + 1].sky[k], x - i));
}
