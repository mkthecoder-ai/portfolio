#!/usr/bin/env node
// Spec 5.2: turns the painted living-background layers (inputs/art/bg/, gitignored) into web assets.
// - Keys the green backdrop and crops each strip to its land (the sky is drawn in code).
// - Turbine row: finds each tower's nacelle and its hub (the rounded nose on the right), so the canvas can spin
//   blades in the right place.
// - Valley: finds the painted settlement lights; they become the nodes of the network lines.
// - Clouds: cuts the sheet into one sprite per cloud.
// Writes WebP to site/public/sky/ and layout data to site/src/components/sky/sky-art.json.
import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";
import { fromRaw, key } from "./art-key.mjs";

const IN = "inputs/art/bg";
const OUT = "site/public/sky";
const WIDTHS = [1600, 2560];
await mkdir(OUT, { recursive: true });

const alphaAt = ({ data, width }, x, y) => data[(y * width + x) * 4 + 3];

/** First row (from the top) that has any opaque pixel. */
function firstOpaqueRow(img) {
  for (let y = 0; y < img.height; y++) for (let x = 0; x < img.width; x += 2) if (alphaAt(img, x, y) > 128) return y;
  return 0;
}

async function writeStrip(name, img, top) {
  const height = img.height - top;
  for (const w of WIDTHS) {
    await fromRaw(img).extract({ left: 0, top, width: img.width, height }).resize({ width: Math.min(w, img.width) })
      .webp({ quality: 78, alphaQuality: 85, effort: 5 }).toFile(`${OUT}/${name}-${w}.webp`);
  }
  return { width: img.width, height };
}

// Hills strip: the low boulder skyline (stages 3, 5 and 6).
const hills = await key(`${IN}/hills.png`);
const hillsTop = Math.max(0, firstOpaqueRow(hills) - 4);
const hillsOut = await writeStrip("hills", hills, hillsTop);

// Turbine row (stages 2 and 6): towers and nacelles, no blades.
const turbines = await key(`${IN}/turbines.png`);
const colTop = Array.from({ length: turbines.width }, (_, x) => {
  let y = 0;
  while (y < turbines.height && alphaAt(turbines, x, y) < 128) y++;
  return y;
});
const towers = [];
for (let x = 0, cur = null; x < turbines.width; x++) {
  const ridge = Math.min(colTop[Math.max(0, x - 120)], colTop[Math.min(turbines.width - 1, x + 120)]);
  const isTower = colTop[x] < ridge - 200;
  if (isTower && !cur) cur = { x0: x, x1: x, top: colTop[x], ground: ridge };
  else if (isTower) { cur.x1 = x; cur.top = Math.min(cur.top, colTop[x]); cur.ground = Math.max(cur.ground, ridge); }
  else if (cur) { towers.push(cur); cur = null; }
}
const turbinesTop = Math.max(0, Math.min(...towers.map((t) => t.top)) - 4);
const hubs = towers.map((t) => {
  // The nacelle is every row from the top that is clearly wider than the mast below it.
  const span = (y) => { let L = -1, R = -1; for (let x = t.x0 - 80; x <= t.x1 + 80; x++) if (alphaAt(turbines, x, y) > 128) { if (L < 0) L = x; R = x; } return R - L; };
  const mast = span(t.top + 200);
  // Start a little below the top: the nacelle's rounded top rows are narrower than the mast.
  let bottom = t.top + 10;
  while (span(bottom) > mast * 1.6 && bottom < t.top + 200) bottom++;
  const w = t.x1 - t.x0;
  // Measured on the art: the hub (the rounded nose) is centred 18.5% of the nacelle's width in from its right end,
  // 44% of the way down the nacelle.
  return {
    x: +((t.x1 - w * 0.185) / turbines.width).toFixed(4),
    y: +((t.top + (bottom - t.top) * 0.44 - turbinesTop) / (turbines.height - turbinesTop)).toFixed(4),
    blade: +((w * 2.4) / turbines.width).toFixed(4),
  };
});
const turbinesOut = await writeStrip("turbines", turbines, turbinesTop);

// Valley with settlement lights (stage 4). The backdrop here darkens towards the land, so the key is softer.
const valley = await key(`${IN}/valley.png`, { lo: 15, hi: 45 });
const valleyTop = Math.max(0, firstOpaqueRow(valley) - 4);
const CELL = 12;
const cols = Math.floor(valley.width / CELL), rows = Math.floor(valley.height / CELL);
const cell = new Float32Array(cols * rows);
const hue = new Uint8Array(cols * rows);
for (let cy = 0; cy < rows; cy++) for (let cx = 0; cx < cols; cx++) {
  let best = 0, bestHue = 0;
  for (let y = cy * CELL; y < (cy + 1) * CELL; y++) for (let x = cx * CELL; x < (cx + 1) * CELL; x++) {
    const i = (y * valley.width + x) * 4;
    if (valley.data[i + 3] < 200) continue;
    const v = Math.max(valley.data[i], valley.data[i + 1], valley.data[i + 2]);
    if (v > best) { best = v; bestHue = valley.data[i + 2] > valley.data[i] ? 1 : 0; }
  }
  cell[cy * cols + cx] = best; hue[cy * cols + cx] = bestHue;
}
let nodes = [];
for (let cy = 2; cy < rows - 2; cy++) for (let cx = 2; cx < cols - 2; cx++) {
  const v = cell[cy * cols + cx];
  if (v < 150) continue;
  let peak = true;
  for (let dy = -2; dy <= 2 && peak; dy++) for (let dx = -2; dx <= 2; dx++) if ((dx || dy) && cell[(cy + dy) * cols + cx + dx] > v) { peak = false; break; }
  if (peak) nodes.push({ x: (cx + 0.5) * CELL, y: (cy + 0.5) * CELL, v, c: hue[cy * cols + cx] ? "c" : "a" });
}
// Keep the brightest light within each 48px neighbourhood.
nodes.sort((a, b) => b.v - a.v);
nodes = nodes.filter((n, i) => nodes.slice(0, i).every((m) => Math.hypot(m.x - n.x, m.y - n.y) > 48));
const vh = valley.height - valleyTop;
const valleyNodes = nodes.map((n) => ({ x: +(n.x / valley.width).toFixed(4), y: +((n.y - valleyTop) / vh).toFixed(4), c: n.c }));
// Network lines: each light to its two nearest neighbours (no duplicates, no long jumps).
const edges = new Set();
nodes.forEach((n, i) => {
  nodes.map((m, j) => ({ j, d: Math.hypot(m.x - n.x, m.y - n.y) })).filter((e) => e.j !== i && e.d < valley.width * 0.12)
    .sort((a, b) => a.d - b.d).slice(0, 2).forEach(({ j }) => edges.add(i < j ? `${i}-${j}` : `${j}-${i}`));
});
const valleyOut = await writeStrip("valley", valley, valleyTop);

// Clouds: one sprite per connected shape on the sheet (found on a quarter-size alpha mask).
const clouds = await key(`${IN}/clouds.png`);
const S = 4, mw = Math.floor(clouds.width / S), mh = Math.floor(clouds.height / S);
const mask = new Uint8Array(mw * mh);
for (let y = 0; y < mh; y++) for (let x = 0; x < mw; x++) mask[y * mw + x] = alphaAt(clouds, x * S, y * S) > 60 ? 1 : 0;
const boxes = [];
for (let start = 0; start < mask.length; start++) {
  if (mask[start] !== 1) continue;
  const stack = [start]; mask[start] = 2;
  let x0 = mw, y0 = mh, x1 = 0, y1 = 0, n = 0;
  while (stack.length) {
    const p = stack.pop(), x = p % mw, y = (p - x) / mw; n++;
    x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
    for (const q of [p - 1, p + 1, p - mw, p + mw]) if (q >= 0 && q < mask.length && mask[q] === 1 && Math.abs((q % mw) - x) <= 1) { mask[q] = 2; stack.push(q); }
  }
  if (n > 400) boxes.push({ x0, y0, x1, y1 });
}
const cloudSprites = [];
for (const [i, b] of boxes.entries()) {
  const pad = 6;
  const left = Math.max(0, b.x0 * S - pad), top = Math.max(0, b.y0 * S - pad);
  const width = Math.min(clouds.width - left, (b.x1 - b.x0 + 1) * S + 2 * pad), height = Math.min(clouds.height - top, (b.y1 - b.y0 + 1) * S + 2 * pad);
  await fromRaw(clouds).extract({ left, top, width, height }).resize({ width: Math.min(width, 900) })
    .webp({ quality: 78, alphaQuality: 85, effort: 5 }).toFile(`${OUT}/cloud-${i}.webp`);
  cloudSprites.push({ width, height });
}

const layout = {
  widths: WIDTHS,
  hills: hillsOut,
  turbines: { ...turbinesOut, hubs },
  valley: { ...valleyOut, nodes: valleyNodes, edges: [...edges].map((e) => e.split("-").map(Number)) },
  clouds: cloudSprites,
};
await mkdir("site/src/components/sky", { recursive: true });
await writeFile("site/src/components/sky/sky-art.json", `${JSON.stringify(layout)}\n`);
console.log(`sky-art: hills, turbines (${hubs.length} hubs), valley (${valleyNodes.length} lights, ${edges.size} lines), ${cloudSprites.length} clouds`);
