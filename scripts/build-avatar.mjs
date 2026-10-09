#!/usr/bin/env node
// Spec 5.3: the approved round-2 bust (inputs/art/avatar-r2-bust.png, gitignored) for the About section.
// Keys the green backdrop (the despill only touches the keyed edges, so the green jacket keeps its colour)
// and writes AVIF and WebP at 320/480/640px wide to site/public/about/.
import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import { fromRaw, key } from "./art-key.mjs";

const OUT = "site/public/about";
await mkdir(OUT, { recursive: true });
const bust = await key("inputs/art/avatar-r2-bust.png", { edgesOnly: true });
for (const w of [320, 480, 640]) {
  await fromRaw(bust).resize({ width: w }).avif({ quality: 60, effort: 6 }).toFile(`${OUT}/avatar-${w}.avif`);
  await fromRaw(bust).resize({ width: w }).webp({ quality: 82, alphaQuality: 90, effort: 6 }).toFile(`${OUT}/avatar-${w}.webp`);
}
console.log(`avatar: ${bust.width}x${bust.height} keyed; wrote 320/480/640 AVIF + WebP`);
