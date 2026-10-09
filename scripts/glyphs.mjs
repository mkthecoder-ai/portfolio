// Text as SVG paths, so build-time images (icons, OG) render in Geist on any machine, without system fonts.
import opentype from "opentype.js";
import { readFileSync } from "node:fs";

const FONTS = "node_modules/geist/dist/fonts";
export const GEIST_MONO_SEMIBOLD = `${FONTS}/geist-mono/GeistMono-SemiBold.ttf`;
export const GEIST_SANS_BOLD = `${FONTS}/geist-sans/Geist-Bold.ttf`;

export function loadFont(file) {
  const buf = readFileSync(file);
  return opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
}

/** Path data for `text`, with its ink box centred on (cx, cy). */
export function capsPath(font, text, { size, cx, cy }) {
  const probe = font.getPath(text, 0, 0, size).getBoundingBox();
  const path = font.getPath(text, cx - (probe.x1 + probe.x2) / 2, cy - (probe.y1 + probe.y2) / 2, size);
  return { d: path.toPathData(2), box: path.getBoundingBox() };
}
