// Official certification badges are third-party files; refuse anything that could run or fetch.
const UNSAFE = [/<script\b/i, /\son[a-z]+\s*=/i, /<foreignObject\b/i, /(?:xlink:)?href\s*=\s*["'](?:[a-z]+:)?\/\//i];

export function safeSvg(svg, name) {
  for (const pattern of UNSAFE) if (pattern.test(svg)) throw new Error(`${name}: unsafe SVG (${pattern})`);
  return svg;
}
