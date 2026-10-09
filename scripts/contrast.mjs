const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const lin = (c) => { const s = c / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; };
const lum = (h) => { const [r, g, b] = hex(h); return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b); };

/** WCAG 2 contrast ratio between two #rrggbb colours. */
export function contrastRatio(a, b) {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** Composites an rgba() colour over an opaque #rrggbb background. */
export function blend(rgba, bgHex) {
  const [r, g, b, a] = rgba.match(/[\d.]+/g).map(Number);
  const bg = hex(bgHex);
  return `#${[r, g, b].map((c, i) => Math.round(a * c + (1 - a) * bg[i]).toString(16).padStart(2, "0")).join("")}`;
}
