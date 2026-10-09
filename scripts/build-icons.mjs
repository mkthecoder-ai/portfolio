#!/usr/bin/env node
// The v2 mark (spec 5.2): "MK" in Geist Bold on a violet-to-dusk rounded square, with one cyan data packet.
// Letters are paths, so it renders the same on any machine. Writes to site/public/:
// favicon.svg, favicon.ico (16/32/48), apple-touch-icon.png (180, full bleed: iOS applies its own mask),
// icon-192.png and icon-512.png (web app manifest).
import sharp from "sharp";
import { writeFile } from "node:fs/promises";
import { pngsToIco } from "./ico.mjs";
import { GEIST_SANS_BOLD, capsPath, loadFont } from "./glyphs.mjs";

const font = loadFont(GEIST_SANS_BOLD);
const VIOLET = "#2a1f5c", DUSK = "#7a3a78", GLOW = "#f39a5a", INK = "#f8f6fd", PACKET = "#22d3ee";

/**
 * The mark on a 64-unit grid. `small` is the 16px cut: bigger letters, no packet (it would be a single blurred pixel).
 * `bleed` drops the rounded corners (the apple touch icon is masked by iOS).
 */
export function mark({ small = false, bleed = false } = {}) {
  const letters = capsPath(font, "MK", { size: small ? 37 : 30, cx: 32, cy: small ? 31 : 32 }).d;
  const packet = small ? "" : `<rect x="47" y="9" width="7" height="7" rx="1" fill="${PACKET}"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs>`
    + `<linearGradient id="s" x1="0" y1="0" x2="0.25" y2="1"><stop offset="0" stop-color="${VIOLET}"/><stop offset="0.8" stop-color="${DUSK}"/><stop offset="1" stop-color="${GLOW}"/></linearGradient>`
    + `</defs><rect width="64" height="64" rx="${bleed ? 0 : small ? 10 : 14}" fill="url(#s)"/>${packet}<path fill="${INK}" d="${letters}"/></svg>\n`;
}

const png = (svg, size) => sharp(Buffer.from(svg), { density: Math.ceil((72 * size) / 64) * 2 }).resize(size, size).png().toBuffer();

await writeFile("site/public/favicon.svg", mark());
await writeFile("site/public/favicon.ico", pngsToIco([
  { png: await png(mark({ small: true }), 16), size: 16 },
  { png: await png(mark(), 32), size: 32 },
  { png: await png(mark(), 48), size: 48 },
]));
await sharp(await png(mark({ bleed: true }), 180)).toFile("site/public/apple-touch-icon.png");
for (const size of [192, 512]) await sharp(await png(mark(), size)).toFile(`site/public/icon-${size}.png`);
console.log("icons: favicon.svg, favicon.ico (16/32/48), apple-touch-icon.png, icon-192.png, icon-512.png");
