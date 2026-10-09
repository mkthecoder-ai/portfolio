// Shared by the art build scripts: chroma key on a green backdrop, and crop to the opaque box.
import sharp from "sharp";

/**
 * RGBA raw buffer with green keyed out: alpha falls off as green dominance rises; spill is clamped.
 * `edgesOnly` limits the despill to pixels the key touched (for subjects that are green themselves, like a jacket).
 */
export async function key(file, { lo = 40, hi = 120, clear = [], edgesOnly = false } = {}) {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const dominance = g - Math.max(r, b);
    // Also key yellow-green glow on the backdrop: green clearly above blue and not far below red.
    const glow = g > 150 && g - b > 90 && g >= r * 0.92 ? Math.min(g - b, 255) : 0;
    const t = Math.min(1, Math.max(0, (Math.max(dominance, glow - 40) - lo) / (hi - lo)));
    data[i + 3] = Math.round(255 * (1 - t));
    if (dominance > 0 && (!edgesOnly || t > 0)) data[i + 1] = Math.max(r, b); // despill
  }
  for (const [x0, y0, x1, y1] of clear) {
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) data[(y * info.width + x) * 4 + 3] = 0;
  }
  return { data, width: info.width, height: info.height };
}
export const fromRaw = ({ data, width, height }) => sharp(data, { raw: { width, height, channels: 4 } });

/** Crop a keyed buffer to its opaque bounding box. */
export async function trim(img) {
  const { data, info } = await fromRaw(img).trim({ threshold: 1 }).raw().toBuffer({ resolveWithObject: true });
  return { data, width: info.width, height: info.height };
}

