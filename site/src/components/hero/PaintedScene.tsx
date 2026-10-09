import art from "./art.json";
import { HUB_R, rimPath, rotorPath } from "@/lib/rotor";

/**
 * Spec 5.1: the painted hero (Higgsfield, style B), as parallax planes inside one 16:9 scene box that covers the
 * viewport. Every plane is placed in % of that box, so all layers stay aligned at any width; planes overlap their
 * neighbours generously, so no seam shows. Ridge, rider and bike are ONE image, so they always move together.
 * Turbine blades are drawn here (the painted towers have none) and spin in the motion loop.
 */
type Box = { left: number; top: number; width: number };
interface Layer { id: keyof typeof art; factor: number; box: Box; fade?: "left" | "bottom"; fadeOut?: [number, number]; drift?: boolean }

const ASPECT = 16 / 9;
// Big-sky composition: the horizon (lake top) sits at 76% so the clear violet upper-left of the sky is behind
// the headline and the sun rests on the horizon. The lake is drawn in front of the hills and shore, hiding their
// bases; the shore and hills fade in from the left so no vertical edge shows.
export const PAINTED_LAYERS: Layer[] = [
  { id: "sky", factor: 0.04, box: { left: -4, top: -8, width: 108 }, drift: true },
  { id: "far-hills", factor: 0.18, box: { left: 40, top: 32, width: 62 }, fade: "left" },
  { id: "shore", factor: 0.28, box: { left: 46, top: 37, width: 58 }, fade: "left" },
  { id: "lake", factor: 0.28, box: { left: -4, top: 76, width: 108 } },
  { id: "ridge", factor: 1.35, box: { left: 30, top: 42, width: 72 }, fade: "bottom", fadeOut: [0.28, 0.42] },
];

const dims = (id: Layer["id"]) => art[id] as { width: number; height: number };
const heightPct = (l: Layer) => { const d = dims(l.id); return l.box.width * (d.height / d.width) * ASPECT; };
const srcSet = (id: string, ext: string) => art.widths.map((w) => `/hero/art/${id}-${w}.${ext} ${w}w`).join(", ");

// Each rotor is one closed outline (three blades and the hub, src/lib/rotor.ts) that spins as one rigid body
// about its hub, with a rim light along each blade and a spinner ring.
function Rotors() {
  const { width, height, hubs } = art.shore;
  const svg = hubs.map((h) =>
    `<g class="rotor" style="transform-box:view-box;transform-origin:${h.x}px ${h.y}px">` +
    `<path d="${rotorPath(h.blade, h.x, h.y)}" fill="#ece6f4" stroke="#2a2440" stroke-width="3" stroke-linejoin="round"/>` +
    `<path d="${rimPath(h.blade, h.x, h.y)}" fill="none" stroke="#f39a5a" stroke-width="2.5" stroke-linecap="round" opacity="0.85"/>` +
    `<circle cx="${h.x}" cy="${h.y}" r="${(h.blade * HUB_R * 0.5).toFixed(1)}" fill="none" stroke="#2a2440" stroke-width="2.5"/></g>`,
  ).join("");
  return <svg className="rotors" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-hidden="true" focusable="false" dangerouslySetInnerHTML={{ __html: svg }} />;
}

export function PaintedScene() {
  return (
    <div className="scene-box">
      {PAINTED_LAYERS.map((l) => (
        <div key={l.id} className={`plane painted${l.fade ? ` fade-${l.fade}` : ""}`} data-plane={l.id} data-factor={l.factor} data-fade-out={l.fadeOut?.join(",")}
          style={{ left: `${l.box.left}%`, top: `${l.box.top}%`, width: `${l.box.width}%`, height: `${heightPct(l).toFixed(2)}%` }}>
          <div className="plane-inner" data-drift={l.drift ? "" : undefined}>
            <picture>
              <source type="image/avif" srcSet={srcSet(l.id, "avif")} sizes={`calc(max(100vw, 177.78svh) * ${(l.box.width / 100).toFixed(2)})`} />
              <img src={`/hero/art/${l.id}-1920.webp`} srcSet={srcSet(l.id, "webp")} sizes={`calc(max(100vw, 177.78svh) * ${(l.box.width / 100).toFixed(2)})`} alt="" loading="lazy" decoding="async" />
            </picture>
            {l.id === "shore" ? <Rotors /> : null}
          </div>
        </div>
      ))}
    </div>
  );
}
