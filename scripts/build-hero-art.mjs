#!/usr/bin/env node
// Spec 5.1: turns the painted Higgsfield layers (inputs/art/, gitignored) into web assets for the hero.
// - Chroma-keys the green-backdrop layers (alpha from green dominance, with green spill removed).
// - Removes a stray floating nacelle from the turbine layer and crops the lake at its waterline.
// - Composites the rider and the Speed 400 onto the ridge ledge as ONE image, with contact shadows, so the
//   ridge, bike and rider can never drift apart (they share one plane in the scroll code).
// - Tones the bike's seat and tank trim from rim-lit orange back to black (Manoj's real bike).
// - Writes responsive WebP and AVIF to site/public/hero/art/ and the layout data to
//   site/src/components/hero/art.json.
import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";
import { fromRaw, key, trim } from "./art-key.mjs";

const IN = "inputs/art";
const OUT = "site/public/hero/art";
const WIDTHS = [1280, 1920, 2560];

/** Rim-lit orange on the seat and tank back to black: desaturate warm hues inside a region (fractions of the image). */
function toneSeat(img, [fx0, fy0, fx1, fy1]) {
  const { data, width, height } = img;
  for (let y = Math.round(fy0 * height); y < Math.round(fy1 * height); y++) {
    for (let x = Math.round(fx0 * width); x < Math.round(fx1 * width); x++) {
      const i = (y * width + x) * 4;
      const r = data[i], g = data[i + 1], b = data[i + 2];
      const max = Math.max(r, g, b), min = Math.min(r, g, b);
      if (max - min < 40 || r < g || r < b) continue; // only warm, saturated pixels
      const hue = (60 * ((g - b) / (max - min)) + 360) % 360;
      if (hue > 50) continue;
      const lum = 0.3 * r + 0.59 * g + 0.11 * b;
      const keep = 0.15;
      data[i] = Math.round((lum + (r - lum) * keep) * 0.8);
      data[i + 1] = Math.round((lum + (g - lum) * keep) * 0.8);
      data[i + 2] = Math.round((lum + (b - lum) * keep) * 0.85);
    }
  }
  return img;
}

/** The lowest opaque pixel in the left and right halves of a keyed image: where each tyre touches the ground. */
function contactPoints({ data, width, height }) {
  const low = [[0, 0], [0, 0]];
  for (let x = 0; x < width; x += 2) {
    let y = height - 1;
    while (y > 0 && data[(y * width + x) * 4 + 3] < 128) y--;
    const side = x < width / 2 ? 0 : 1;
    if (y > low[side][1]) low[side] = [x, y];
  }
  return low.map(([x, y]) => [x / width, y / height]);
}

async function write(name, pipeline, { maxWidth }) {
  for (const w of WIDTHS.filter((w) => w <= maxWidth + 200)) {
    const width = Math.min(w, maxWidth);
    await pipeline().resize({ width }).webp({ quality: 80, alphaQuality: 90, effort: 5 }).toFile(`${OUT}/${name}-${w}.webp`);
    await pipeline().resize({ width }).avif({ quality: 55, effort: 5 }).toFile(`${OUT}/${name}-${w}.avif`);
  }
}

await mkdir(OUT, { recursive: true });

// Sky: opaque, used as is.
const sky = await sharp(`${IN}/layers/sky.png`).metadata();
await write("sky", () => sharp(`${IN}/layers/sky.png`), { maxWidth: sky.width });

// Far boulder hills.
const far = await key(`${IN}/layers/far-hills.png`);
await write("far-hills", () => fromRaw(far).png(), { maxWidth: far.width });

// Near shore with turbine towers (blades are drawn in code); remove the stray floating nacelle.
const shore = await key(`${IN}/layers/shore-turbines.png`, { clear: [[1105, 145, 1230, 225]] });
await write("shore", () => fromRaw(shore).png(), { maxWidth: shore.width });
const HUBS = [[1131, 294, 1210], [1456, 499, 1509], [1978, 589, 2024], [2231, 421, 2307], [2526, 644, 2567], [2912, 571, 2974]]
  .map(([x0, top, x1]) => ({ x: x0 + 6, y: top + Math.round((x1 - x0) * 0.22), blade: Math.round((x1 - x0) * 2.4) }));

// Lake: crop off the painted sky band above the waterline (row 396 of 1536).
const lakeMeta = await sharp(`${IN}/layers/lake.png`).metadata();
const WATERLINE = 396;
await write("lake", () => sharp(`${IN}/layers/lake.png`).extract({ left: 0, top: WATERLINE, width: lakeMeta.width, height: lakeMeta.height - WATERLINE }), { maxWidth: lakeMeta.width });

// Ridge + rider + bike, composited as one image.
const ridge = await key(`${IN}/layers/ridge.png`);
const LEDGE_Y = 642;
const RIDER_H = 420;
const rider = await trim(await key(`${IN}/avatar-r2-back.png`));
const bike = await trim(toneSeat(await key(`${IN}/bike-speed400.png`), [0.34, 0.16, 0.88, 0.46]));
const riderPng = await fromRaw(rider).resize({ height: RIDER_H }).png().toBuffer();
const riderMeta = await sharp(riderPng).metadata();
const BIKE_H = Math.round(RIDER_H * 0.66);
const bikePng = await fromRaw(bike).resize({ height: BIKE_H }).png().toBuffer();
const bikeMeta = await sharp(bikePng).metadata();
// The painted ledge is seen almost edge-on and rises into rock on the right. The bike stands so its front tyre is
// on the flat ledge and its rear tyre (higher in this three-quarter view) rests where the rock starts to rise;
// the rider stands just in front of the bike.
const bikeX = 1774, riderX = bikeX - riderMeta.width - 30;
const bikeTop = LEDGE_Y + 4 - bikeMeta.height;
// Contact shadows: under the boots, under each tyre (the rear one sits higher in this three-quarter view),
// and a soft band under the bike's body along the slope between the two tyres.
const [front, rear] = contactPoints(bike).map(([fx, fy]) => [bikeX + fx * bikeMeta.width, bikeTop + fy * bikeMeta.height]);
const slope = (Math.atan2(rear[1] - front[1], rear[0] - front[0]) * 180) / Math.PI;
const mid = [(front[0] + rear[0]) / 2, (front[1] + rear[1]) / 2];
const span = Math.hypot(rear[0] - front[0], rear[1] - front[1]);
const shadow = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${ridge.width}" height="${ridge.height}">
  <defs><filter id="b" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6"/></filter></defs>
  <g filter="url(#b)" fill="#0b0712">
    <ellipse cx="${riderX + riderMeta.width / 2}" cy="${LEDGE_Y + 2}" rx="${Math.round(riderMeta.width * 0.6)}" ry="10" opacity="0.6"/>
    <ellipse cx="${mid[0].toFixed(1)}" cy="${(mid[1] + 2).toFixed(1)}" rx="${(span * 0.55).toFixed(1)}" ry="13" opacity="0.4" transform="rotate(${slope.toFixed(1)} ${mid[0].toFixed(1)} ${(mid[1] + 2).toFixed(1)})"/>
    <ellipse cx="${front[0].toFixed(1)}" cy="${(front[1] + 1).toFixed(1)}" rx="34" ry="8" opacity="0.75"/>
    <ellipse cx="${rear[0].toFixed(1)}" cy="${(rear[1] + 1).toFixed(1)}" rx="30" ry="7" opacity="0.75"/>
  </g></svg>`);
const ridgeComposite = await fromRaw(ridge)
  .composite([
    { input: shadow, left: 0, top: 0 },
    { input: bikePng, left: bikeX, top: bikeTop },
    { input: riderPng, left: riderX, top: LEDGE_Y + 2 - riderMeta.height },
  ])
  .png()
  .toBuffer();
await write("ridge", () => sharp(ridgeComposite), { maxWidth: ridge.width });

const layout = {
  sky: { width: sky.width, height: sky.height },
  "far-hills": { width: far.width, height: far.height },
  shore: { width: shore.width, height: shore.height, hubs: HUBS },
  lake: { width: lakeMeta.width, height: lakeMeta.height - WATERLINE },
  ridge: { width: ridge.width, height: ridge.height, ledgeY: LEDGE_Y },
  widths: WIDTHS,
};
await writeFile("site/src/components/hero/art.json", `${JSON.stringify(layout, null, 2)}\n`);
console.log("hero-art: wrote", Object.keys(layout).filter((k) => k !== "widths").join(", "));
