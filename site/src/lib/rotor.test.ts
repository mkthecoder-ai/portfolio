import { describe, it, expect } from "vitest";
import { rotor, rotorPath, BLADES, HUB_R } from "./rotor";

// One rigid rotor: three blades and the hub as a single closed outline, pivoting at the hub centre (0, 0).
describe("turbine rotor geometry", () => {
  const g = rotor();
  const dist = ([x, y]: readonly [number, number]) => Math.hypot(x, y);
  const angleOf = ([x, y]: readonly [number, number]) => Math.atan2(y, x);

  it("has exactly three blades, 120° apart, the first pointing straight up", () => {
    expect(BLADES).toBe(3);
    expect(g.tips).toHaveLength(3);
    const deg = g.tips.map((p) => (angleOf(p) * 180) / Math.PI);
    expect(deg[0]).toBeCloseTo(-90, 5);
    expect(deg[1]).toBeCloseTo(30, 5);
    expect(deg[2]).toBeCloseTo(150, 5);
    for (const tip of g.tips) expect(dist(tip)).toBeCloseTo(1, 5);
  });

  it("pivots at the hub centre: the outline is balanced around (0, 0)", () => {
    const cx = g.outline.reduce((s, p) => s + p[0], 0) / g.outline.length;
    const cy = g.outline.reduce((s, p) => s + p[1], 0) / g.outline.length;
    expect(Math.abs(cx)).toBeLessThan(1e-9);
    expect(Math.abs(cy)).toBeLessThan(1e-9);
  });

  it("is one closed outline, so the blades can never separate from the hub or each other", () => {
    // Every point is either on the hub circle or on a blade; nothing floats beyond the blade length.
    for (const p of g.outline) expect(dist(p)).toBeLessThanOrEqual(1 + 1e-9);
    // The outline returns to the hub circle between blades (hub arcs), three times.
    const onHub = g.outline.map((p) => Math.abs(dist(p) - HUB_R) < 1e-9);
    let arcs = 0;
    for (let i = 0; i < onHub.length; i++) if (onHub[i] && !onHub[(i + onHub.length - 1) % onHub.length]) arcs++;
    expect(arcs).toBe(3);
    // A single subpath: exactly one move-to and one close.
    const d = rotorPath(100);
    expect(d.match(/M/g)).toHaveLength(1);
    expect(d.match(/Z/g)).toHaveLength(1);
  });

  it("gives each blade a real aerodynamic chord: widest near the root, tapering to a narrow tip", () => {
    const { chord } = g;
    const max = Math.max(...chord.map((c) => c.w));
    const at = (s: number) => chord.reduce((a, b) => (Math.abs(b.s - s) < Math.abs(a.s - s) ? b : a)).w;
    expect(max).toBeGreaterThanOrEqual(0.07); // not a hairline
    expect(max).toBeLessThanOrEqual(0.11); // not a paddle
    expect(at(0.25)).toBeGreaterThan(at(0.6));
    expect(at(0.6)).toBeGreaterThan(at(0.95));
    // The root is wide enough to read as attached, and narrower than the hub it grows from.
    expect(chord[0].w).toBeGreaterThan(HUB_R * 0.6);
    expect(chord[0].w).toBeLessThan(HUB_R * 2);
  });

  it("is the same rotor at every angle: rotating it only rotates it", () => {
    const d0 = rotor().outline, d1 = rotor(37).outline;
    const r = (37 * Math.PI) / 180;
    d0.forEach(([x, y], i) => {
      expect(d1[i][0]).toBeCloseTo(x * Math.cos(r) - y * Math.sin(r), 9);
      expect(d1[i][1]).toBeCloseTo(x * Math.sin(r) + y * Math.cos(r), 9);
    });
  });

  it("scales and places the path at the hub", () => {
    const d = rotorPath(200, 1000, 500);
    const nums = [...d.matchAll(/(-?[\d.]+) (-?[\d.]+)/g)].map((m) => [Number(m[1]), Number(m[2])] as const);
    for (const [x, y] of nums) expect(Math.hypot(x - 1000, y - 500)).toBeLessThanOrEqual(200.6);
    // The top tip lies straight above the hub.
    expect(nums.some(([x, y]) => Math.abs(x - 1000) < 1 && Math.abs(y - 300) < 1)).toBe(true);
  });
});
