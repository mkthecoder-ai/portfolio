#!/usr/bin/env node
// Official badges (inputs/badges, gitignored) become small self-hosted files in site/public/badges (committed).
import sharp from "sharp";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { safeSvg } from "./badges.mjs";

const IN = "inputs/badges";
const OUT = "site/public/badges";
await mkdir(OUT, { recursive: true });
for (const [src, dest] of [["microsoft-certified-associate.svg", "az-104.svg"], ["microsoft-certified-fundamentals.svg", "az-900.svg"]]) {
  await writeFile(`${OUT}/${dest}`, safeSvg(await readFile(`${IN}/${src}`, "utf8"), src));
}
// Shown at 128px (spec 5.3); 280px covers 2x screens.
await sharp(`${IN}/terraform-associate-003.png`).resize(280, 280).webp({ quality: 82 }).toFile(`${OUT}/terraform-associate-003.webp`);
console.log("badges: az-104.svg, az-900.svg and terraform-associate-003.webp written");
