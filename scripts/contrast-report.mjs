#!/usr/bin/env node
// Prints the WCAG contrast table from site/src/app/tokens.css and fails below AA.
import { readFile } from "node:fs/promises";
import { blend, contrastRatio } from "./contrast.mjs";

const css = await readFile("site/src/app/tokens.css", "utf8");
const t = Object.fromEntries([...css.matchAll(/--([a-z-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]));
const solid = (name, over) => (t[name].startsWith("rgba") ? blend(t[name], t[over]) : t[name]);
const PAIRS = [
  ["text", "bg", 4.5], ["text", "surface", 4.5], ["muted", "bg", 4.5], ["muted", "surface", 4.5],
  ["accent", "bg", 4.5], ["accent", "surface", 4.5], ["on-accent", "accent", 4.5],
  ["border-control", "bg", 3], ["border-control", "surface", 3],
];
let failed = false;
console.log("| Pair | Ratio | Minimum | Result |\n|---|---|---|---|");
for (const [fg, bg, min] of PAIRS) {
  const ratio = contrastRatio(solid(fg, bg), t[bg]);
  const ok = ratio >= min;
  failed ||= !ok;
  console.log(`| ${fg} on ${bg} | ${ratio.toFixed(2)}:1 | ${min}:1 | ${ok ? "pass" : "FAIL"} |`);
}
if (failed) process.exit(1);
