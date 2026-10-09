// Spec 5.2: the living background, drawn on one fixed full-viewport canvas behind the page. Loaded lazily after
// first paint (LivingSky). The sky gradient follows the scroll through six stages; stars, aurora, clouds, data
// packets and network lines are procedural; the hills, turbine row, valley and the rider + bike are the painted
// layers, with parallax inside each stage. Capped at 60 fps, paused while the tab is hidden or the hero covers the
// screen, lighter on weak devices, and only gradient + stars + a few packets on phones.
import art from "./sky-art.json";
import heroArt from "../hero/art.json";
import { layerWeight, skyAt, stageAt, type Layer } from "./stages";
import { HUB_R, rotorPath } from "@/lib/rotor";

type Mode = "full" | "phone";
type Source = HTMLImageElement | HTMLCanvasElement;
interface Block { top: number; bottom: number }

// The test hook (also read by e2e/sky.spec.ts).
// `rotors`: where each turbine rotor was last drawn (CSS px, angle in radians), for the rotor e2e checks.
interface RotorPose { x: number; y: number; L: number; angle: number }
declare global { interface Window { __sky?: { ready: boolean; frames: number; stage: number; mode: string; rotors: RotorPose[] } } }

const TAU = Math.PI * 2;
const rand = (a: number, b: number) => a + Math.random() * (b - a);
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const smooth = (a: number, b: number, x: number) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };

function loadImage(src: string): Promise<HTMLImageElement> {
  const img = new Image();
  img.decoding = "async";
  img.src = src;
  return img.decode().then(() => img);
}

/** A copy of `img` washed with `color` (for night, pre-dawn and backlit versions of the painted layers). */
function tinted(img: HTMLImageElement, color: string, amount: number): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = img.naturalWidth; c.height = img.naturalHeight;
  const g = c.getContext("2d")!;
  g.drawImage(img, 0, 0);
  g.globalCompositeOperation = "source-atop";
  g.globalAlpha = amount;
  g.fillStyle = color;
  g.fillRect(0, 0, c.width, c.height);
  return c;
}

/** A soft round glow, drawn once and stamped for packets and valley lights (cheaper than shadowBlur). */
function glowSprite(rgb: string): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = c.height = 32;
  const g = c.getContext("2d")!;
  const r = g.createRadialGradient(16, 16, 0, 16, 16, 16);
  r.addColorStop(0, `rgba(${rgb},0.9)`); r.addColorStop(0.35, `rgba(${rgb},0.35)`); r.addColorStop(1, `rgba(${rgb},0)`);
  g.fillStyle = r; g.fillRect(0, 0, 32, 32);
  return c;
}

/** One aurora curtain column: bright at its lower edge, fading upward. */
function curtainSprite(rgb: string): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = 1; c.height = 64;
  const g = c.getContext("2d")!;
  const l = g.createLinearGradient(0, 0, 0, 64);
  l.addColorStop(0, `rgba(${rgb},0)`); l.addColorStop(0.7, `rgba(${rgb},0.55)`); l.addColorStop(0.93, `rgba(${rgb},1)`); l.addColorStop(1, `rgba(${rgb},0)`);
  g.fillStyle = l; g.fillRect(0, 0, 1, 64);
  return c;
}

export function startSky(canvas: HTMLCanvasElement): () => void {
  const root = document.documentElement;
  const mode: Mode = matchMedia("(max-width: 767px)").matches ? "phone" : "full";
  const nav = navigator as Navigator & { deviceMemory?: number };
  const weak = (nav.hardwareConcurrency ?? 8) < 4 || (nav.deviceMemory ?? 8) < 4;
  const scale = mode === "phone" ? 0.35 : weak ? 0.55 : 1;
  const ctx = canvas.getContext("2d", { alpha: false })!;
  const hero = document.getElementById("home");

  let W = 0, H = 0, dpr = 1;
  const resize = () => {
    dpr = mode === "phone" ? 1 : Math.min(1.5, window.devicePixelRatio || 1);
    W = canvas.clientWidth; H = canvas.clientHeight;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
  };

  // Stage blocks in document coordinates (re-measured when the page's height changes).
  let blocks: Block[] = [];
  const measure = () => {
    blocks = [1, 2, 3, 4, 5, 6].map((n) => {
      const els = [...document.querySelectorAll<HTMLElement>(`[data-stage="${n}"]`)];
      const rects = els.map((el) => el.getBoundingClientRect());
      return { top: Math.min(...rects.map((r) => r.top)) + scrollY, bottom: Math.max(...rects.map((r) => r.bottom)) + scrollY };
    });
  };

  // ---- Procedural layers ----
  const stars = Array.from({ length: Math.round(280 * scale) }, () => ({
    x: Math.random(), y: Math.random() ** 1.4 * 0.82, size: rand(0.6, 1.8), base: rand(0.35, 1), f: rand(0.6, 2.2), phase: rand(0, TAU), cyan: Math.random() < 0.12,
  }));
  let shooting: { x: number; y: number; vx: number; vy: number; life: number } | null = null;
  let nextShoot = performance.now() + rand(3000, 5000);
  const packets: { x: number; y: number; vy: number; size: number; phase: number; life: number; ttl: number }[] = [];
  const maxPackets = Math.round(46 * scale);
  const glowCyan = glowSprite("34,211,238");
  const glowAmber = glowSprite("255,184,92");
  const curtains = ["34,211,238", "45,212,191", "167,139,250"].map(curtainSprite);
  const aurora = document.createElement("canvas");
  const actx = aurora.getContext("2d")!;
  const ribbons = [
    { span: [0.02, 0.72], base: 0.34, phase: 0 },
    { span: [0.3, 1.0], base: 0.4, phase: 2.1 },
    { span: [0.0, 0.55], base: 0.47, phase: 4.2 },
  ];
  const clouds = [0, 1, 2, 3, 4, 5].map((i) => ({ i, x: rand(0, 1), y: rand(0.06, 0.42), speed: rand(4, 11) }));
  const rotorShape = new Path2D(rotorPath(1));
  const travellers = Array.from({ length: Math.round(18 * scale) }, () => ({ e: Math.floor(rand(0, art.valley.edges.length)), t: Math.random(), v: rand(0.18, 0.4), fwd: Math.random() < 0.5 }));

  // ---- Painted layers (desktop only), loaded after the engine starts ----
  const layers: Partial<Record<"hills3" | "hills5" | "turbines2" | "turbines6" | "valley" | "rider", Source>> = {};
  const cloudImgs: HTMLImageElement[] = [];
  if (mode === "full") {
    const w = window.innerWidth * (window.devicePixelRatio || 1) > 2000 ? 2560 : 1600;
    const rw = window.innerWidth * (window.devicePixelRatio || 1) > 2000 ? 1920 : 1280;
    loadImage(`/sky/hills-${w}.webp`).then((img) => { layers.hills3 = tinted(img, "#04071a", 0.55); layers.hills5 = tinted(img, "#1c1946", 0.3); }).catch(() => {});
    loadImage(`/sky/turbines-${w}.webp`).then((img) => { layers.turbines2 = tinted(img, "#1b1642", 0.2); layers.turbines6 = tinted(img, "#1d1233", 0.62); }).catch(() => {});
    loadImage(`/sky/valley-${w}.webp`).then((img) => { layers.valley = img; }).catch(() => {});
    loadImage(`/hero/art/ridge-${rw}.webp`).then((img) => { layers.rider = tinted(img, "#1a1030", 0.6); }).catch(() => {});
    art.clouds.forEach((_, i) => loadImage(`/sky/cloud-${i}.webp`).then((img) => { cloudImgs[i] = img; }).catch(() => {}));
  }

  /** Draws a painted strip across the bottom: wider than the screen, panned by `q` (0..1 through its stage). */
  const strip = (src: Source, srcW: number, srcH: number, alpha: number, cap: number, q: number, depth: number) => {
    const sw = 1.1 * Math.max(W, 1.4 * H);
    const sh = (sw * srcH) / srcW;
    const x = (W - sw) / 2 + (0.5 - q) * (sw - W) * depth;
    const y = H - sh + Math.max(0, sh - cap * H) + (1 - alpha) * 0.18 * H + (q - 0.5) * 0.04 * H * depth;
    ctx.globalAlpha = alpha;
    ctx.drawImage(src, x, y, sw, sh);
    return { x, y, sw, sh };
  };

  const progressIn = (n: number, probe: number) => { const b = blocks[n - 1]; return b ? clamp01((probe - b.top) / Math.max(1, b.bottom - b.top)) : 0.5; };

  let raf = 0, last = performance.now(), lastDraw = 0, frames = 0, running = false;
  const state = { ready: false, frames: 0, stage: 1, mode, rotors: [] as RotorPose[] };
  window.__sky = state;

  const frame = (now: number) => {
    raf = requestAnimationFrame(frame);
    if (now - lastDraw < 1000 / 61) return; // 60 fps cap (high-refresh screens)
    const dt = Math.min(0.05, (now - last) / 1000); last = now; lastDraw = now;
    const t = now / 1000;

    const probe = scrollY + H * 0.6;
    const s = stageAt(probe, blocks.slice(0, 5).map((b) => b.bottom), H);
    state.stage = s;
    const w = (l: Layer) => layerWeight(l, s);

    // While the hero fully covers the screen, there is nothing to draw.
    if (hero) {
      const r = hero.getBoundingClientRect();
      const live = root.dataset.hero === "live";
      const p = clamp01(-r.top / Math.max(1, hero.offsetHeight - H));
      if (r.bottom >= H && (!live || p < 0.7) && state.ready) return;
    }

    // Sky.
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over";
    const stops = skyAt(s);
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, stops[0]); g.addColorStop(0.45, stops[1]); g.addColorStop(0.8, stops[2]); g.addColorStop(1, stops[3]);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

    // Sun (sunrise): a warm glow low on the right, rising as the stage arrives.
    const sun = w("sun");
    if (sun > 0.01) {
      const sx = W * 0.74, sy = H * (0.84 - 0.1 * sun);
      const rg = ctx.createRadialGradient(sx, sy, 0, sx, sy, Math.max(W, H) * 0.6);
      rg.addColorStop(0, "rgba(255,226,160,0.75)"); rg.addColorStop(0.18, "rgba(255,184,112,0.35)"); rg.addColorStop(1, "rgba(255,150,110,0)");
      ctx.globalAlpha = sun; ctx.fillStyle = rg; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#fff0c8"; ctx.beginPath(); ctx.arc(sx, sy, Math.max(W, H) * 0.028, 0, TAU); ctx.fill();
    }

    // Stars, twinkling, thinning towards the horizon.
    const sw = w("stars");
    if (sw > 0.01) {
      for (const st of stars) {
        const a = sw * st.base * (0.6 + 0.4 * Math.sin(t * st.f + st.phase)) * (1 - st.y / 0.9);
        if (a <= 0.02) continue;
        ctx.globalAlpha = a;
        ctx.fillStyle = st.cyan ? "#a5f3fc" : "#f4f1ff";
        ctx.fillRect(st.x * W, st.y * H, st.size, st.size);
      }
    }

    // Shooting stars: at most one every 8-12 s, only while the night stage holds.
    if (mode === "full" && w("shooting") > 0.5 && !shooting && now > nextShoot) {
      const dir = Math.random() < 0.5 ? -1 : 1;
      shooting = { x: W * rand(0.2, 0.8), y: H * rand(0.05, 0.3), vx: dir * rand(520, 700), vy: rand(220, 320), life: 0 };
      nextShoot = now + rand(8000, 12000);
    }
    if (shooting) {
      shooting.life += dt;
      const k = shooting.life / 0.9;
      if (k >= 1) shooting = null;
      else {
        const hx = shooting.x + shooting.vx * shooting.life, hy = shooting.y + shooting.vy * shooting.life;
        const len = 0.22;
        const lg = ctx.createLinearGradient(hx, hy, hx - shooting.vx * len, hy - shooting.vy * len);
        lg.addColorStop(0, "rgba(240,250,255,0.95)"); lg.addColorStop(1, "rgba(240,250,255,0)");
        ctx.globalAlpha = Math.sin(k * Math.PI) * w("shooting");
        ctx.strokeStyle = lg; ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(hx - shooting.vx * len, hy - shooting.vy * len); ctx.stroke();
      }
    }

    // Aurora: curtains drawn at quarter resolution (soft by nature), added onto the sky.
    const aw = w("aurora");
    if (mode === "full" && aw > 0.01) {
      const ax = Math.max(1, Math.round(W / 4)), ay = Math.max(1, Math.round(H / 4));
      if (aurora.width !== ax || aurora.height !== ay) { aurora.width = ax; aurora.height = ay; }
      actx.globalCompositeOperation = "source-over";
      actx.clearRect(0, 0, ax, ay);
      actx.globalCompositeOperation = "lighter";
      const step = weak ? 2 : 1;
      ribbons.forEach((r, ri) => {
        for (let x = 0; x < ax; x += step) {
          const u = x / ax;
          const env = smooth(r.span[0], r.span[0] + 0.12, u) * (1 - smooth(r.span[1] - 0.12, r.span[1], u));
          if (env <= 0.01) continue;
          const base = ay * (r.base + 0.06 * Math.sin(x * 0.018 + t * 0.12 + r.phase) + 0.03 * Math.sin(x * 0.051 - t * 0.21 + r.phase));
          const h = ay * (0.24 + 0.1 * Math.sin(x * 0.011 + t * 0.07 + r.phase * 1.7));
          const intensity = (0.35 + 0.65 * (0.5 + 0.5 * Math.sin(x * 0.027 + t * 0.33 + r.phase * 3)) * (0.5 + 0.5 * Math.sin(x * 0.007 - t * 0.05 + r.phase))) * env;
          actx.globalAlpha = intensity * 0.85;
          actx.drawImage(curtains[ri], x, base - h, step + 0.6, h);
        }
      });
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = aw;
      ctx.drawImage(aurora, 0, 0, W, H);
      ctx.globalCompositeOperation = "source-over";
    }

    // Clouds drifting slowly to the right.
    const cw = w("clouds");
    if (cw > 0.01) {
      clouds.forEach((c) => {
        const img = cloudImgs[c.i];
        if (!img) return;
        const dw = (art.clouds[c.i].width / 2752) * W * 0.85;
        const dh = (dw * art.clouds[c.i].height) / art.clouds[c.i].width;
        const span = W + dw * 2;
        const x = ((c.x * span + t * c.speed) % span) - dw;
        ctx.globalAlpha = cw * 0.85;
        ctx.drawImage(img, x, c.y * H, dw, dh);
      });
    }

    // Painted silhouettes (desktop).
    if (mode === "full") {
      const hw = w("hills");
      const hillsSrc = s < 4 ? layers.hills3 : layers.hills5;
      if (hw > 0.01 && hillsSrc) strip(hillsSrc, art.hills.width, art.hills.height, hw, 0.38, progressIn(s < 4 ? 3 : 5, probe), 0.5);

      const vw = w("valley");
      if (vw > 0.01 && layers.valley) {
        const v = strip(layers.valley, art.valley.width, art.valley.height, vw, 0.56, progressIn(4, probe), 0.6);
        const pt = (i: number) => [v.x + art.valley.nodes[i].x * v.sw, v.y + art.valley.nodes[i].y * v.sh] as const;
        const nw = w("network");
        ctx.globalAlpha = 0.45 * nw; ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 1.2;
        ctx.beginPath();
        for (const [a, b] of art.valley.edges) { const [ax2, ay2] = pt(a), [bx, by] = pt(b); ctx.moveTo(ax2, ay2); ctx.lineTo(bx, by); }
        ctx.stroke();
        art.valley.nodes.forEach((n, i) => {
          const [x, y] = pt(i);
          ctx.globalAlpha = vw * (0.45 + 0.35 * Math.sin(t * 1.3 + i * 1.7));
          ctx.drawImage(n.c === "c" ? glowCyan : glowAmber, x - 13, y - 13, 26, 26);
        });
        for (const tr of travellers) {
          tr.t += tr.v * dt;
          if (tr.t >= 1) { tr.t = 0; tr.e = Math.floor(rand(0, art.valley.edges.length)); tr.fwd = Math.random() < 0.5; }
          const [a, b] = art.valley.edges[tr.e];
          const [x0, y0] = pt(tr.fwd ? a : b), [x1, y1] = pt(tr.fwd ? b : a);
          const x = x0 + (x1 - x0) * tr.t, y = y0 + (y1 - y0) * tr.t;
          ctx.globalAlpha = nw * Math.sin(tr.t * Math.PI);
          ctx.drawImage(glowCyan, x - 10, y - 10, 20, 20);
          ctx.fillStyle = "#cffafe"; ctx.fillRect(x - 2, y - 2, 4, 4);
        }
      }

      const tw = w("turbines");
      const turbSrc = s < 4 ? layers.turbines2 : layers.turbines6;
      if (tw > 0.01 && turbSrc) {
        const box = strip(turbSrc, art.turbines.width, art.turbines.height, tw, 0.6, progressIn(s < 4 ? 2 : 6, probe), 0.35);
        // Each rotor is one closed outline (blades + hub) turned as one rigid body about its hub: one fill and one
        // ink stroke, like the painted towers, so no blade can drift off the hub or show a seam while fading.
        ctx.fillStyle = s < 4 ? "#c4b8e0" : "#24183c";
        ctx.strokeStyle = s < 4 ? "#2a2440" : "#170f28";
        ctx.lineJoin = "round";
        ctx.globalAlpha = tw;
        art.turbines.hubs.forEach((hub, i) => {
          const L = hub.blade * box.sw, x = box.x + hub.x * box.sw, y = box.y + hub.y * box.sh, angle = t * 1.1 + i * 0.9;
          const pose = (state.rotors[i] ??= { x, y, L, angle });
          pose.x = x; pose.y = y; pose.L = L; pose.angle = angle;
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(angle);
          ctx.scale(L, L);
          ctx.lineWidth = 1.2 / L;
          ctx.fill(rotorShape);
          ctx.stroke(rotorShape);
          ctx.beginPath(); ctx.arc(0, 0, HUB_R * 0.5, 0, TAU); ctx.stroke();
          ctx.restore();
        });
      }

      // The bookend: the rider and the bike on the ridge again, backlit by the sunrise.
      const rw = w("rider");
      if (rw > 0.01 && layers.rider) {
        const hR = Math.min(H * 0.62, W * 0.42);
        const wR = (hR * heroArt.ridge.width) / heroArt.ridge.height;
        const ledge = heroArt.ridge.ledgeY / heroArt.ridge.height;
        const x = W * 0.86 - wR * 0.68;
        const y = H * 0.72 - ledge * hR + (1 - rw) * 0.2 * H;
        ctx.globalAlpha = rw;
        ctx.drawImage(layers.rider, x, y, wR, hR);
      }
    }

    // Rising data packets.
    const want = Math.round(maxPackets * w("packets"));
    while (packets.length < want) packets.push({ x: rand(0, 1), y: rand(0, 1), vy: rand(14, 36), size: rand(2.2, 4.4), phase: rand(0, TAU), life: 0, ttl: rand(6, 14) });
    for (let i = packets.length - 1; i >= 0; i--) {
      const k = packets[i];
      k.life += dt; k.y -= (k.vy * dt) / H;
      const a = Math.min(1, k.life / 1.2, (k.ttl - k.life) / 1.5);
      if (a <= 0 || k.y < -0.02) {
        if (packets.length > want) packets.splice(i, 1);
        else packets[i] = { ...k, x: rand(0, 1), y: 1.02, life: 0, ttl: rand(6, 14) };
        continue;
      }
      const x = k.x * W + Math.sin(t * 0.8 + k.phase) * 6, y = k.y * H;
      ctx.globalAlpha = a * 0.5;
      ctx.drawImage(glowCyan, x - k.size * 2, y - k.size * 2, k.size * 5, k.size * 5);
      ctx.globalAlpha = a * 0.9; ctx.fillStyle = "#22d3ee";
      ctx.fillRect(x, y, k.size, k.size);
    }
    ctx.globalAlpha = 1;

    frames++; state.frames = frames;
    if (!state.ready) { state.ready = true; root.dataset.sky = "live"; }
  };

  const start = () => { if (!running && document.visibilityState === "visible") { running = true; last = performance.now(); raf = requestAnimationFrame(frame); } };
  const stop = () => { running = false; cancelAnimationFrame(raf); raf = 0; };
  const onVisibility = () => (document.visibilityState === "visible" ? start() : stop());
  const onResize = () => { resize(); measure(); };
  const ro = new ResizeObserver(() => measure());

  resize(); measure();
  ro.observe(document.body);
  window.addEventListener("resize", onResize);
  document.addEventListener("visibilitychange", onVisibility);
  start();
  return () => {
    stop(); ro.disconnect();
    window.removeEventListener("resize", onResize);
    document.removeEventListener("visibilitychange", onVisibility);
    delete root.dataset.sky;
  };
}
