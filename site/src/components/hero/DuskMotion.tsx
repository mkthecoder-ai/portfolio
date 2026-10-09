"use client";
// Spec 5.0 sections 4 and 10: the live hero's motion, in one small rAF loop (no animation library).
// Planes rise at their parallax factors as the camera descends, turbines spin up, data packets drift upward,
// the headline lifts away and the scene dissolves into the living sky (or #070A0F without it). Runs only for data-hero="live", and only
// while the hero is on screen and the tab is visible.
import { useEffect } from "react";

// The test hook (read by the e2e suite and scripts/build-hero-static.mjs).
declare global { interface Window { __dusk?: { ready: boolean; frames: number } } }

const smooth = (a: number, b: number, x: number) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

interface Packet { x: number; y: number; vy: number; size: number; phase: number; life: number; ttl: number }

export function DuskMotion() {
  useEffect(() => {
    const root = document.documentElement;
    if (root.dataset.hero !== "live") return;
    const hero = document.getElementById("home");
    const scene = hero?.querySelector<HTMLElement>(".dusk-scene");
    const canvas = hero?.querySelector<HTMLCanvasElement>(".packets");
    const copy = hero?.querySelector<HTMLElement>(".dusk-copy");
    const shade = hero?.querySelector<HTMLElement>(".dusk-shade");
    if (!hero || !scene || !canvas || !copy || !shade) return;
    // data-fade-out="a,b": the plane dissolves between scroll progress a and b (the ridge, once the camera drops past it).
    const planes = Array.from(scene.querySelectorAll<HTMLElement>(".plane")).map((el) => ({ el, f: Number(el.dataset.factor), fade: el.dataset.fadeOut?.split(",").map(Number) }));
    const rotors = Array.from(scene.querySelectorAll<SVGGElement>(".rotor")).map((el, i) => ({ el, angle: i * 37 }));
    const drift = scene.querySelector<HTMLElement>("[data-drift]");
    const ctx = canvas.getContext("2d");
    const packets: Packet[] = [];
    let raf = 0, last = performance.now(), visible = true, width = 0, height = 0, dpr = 1;

    const resize = () => {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      width = canvas.clientWidth; height = canvas.clientHeight;
      canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
    };
    const spawn = (anywhere: boolean): Packet => ({
      x: width * (0.35 + Math.random() * 0.65), y: anywhere ? Math.random() * height : height + 10,
      vy: 14 + Math.random() * 22, size: 2.4 + Math.random() * 2.8, phase: Math.random() * Math.PI * 2, life: 0, ttl: 6 + Math.random() * 8,
    });

    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      const rect = hero.getBoundingClientRect();
      const track = Math.max(1, hero.offsetHeight - window.innerHeight);
      const p = Math.min(1, Math.max(0, -rect.top / track));
      const D = window.innerHeight * 1.1;
      for (const { el, f, fade } of planes) {
        el.style.transform = `translate3d(0, ${(-p * D * f).toFixed(1)}px, 0)`;
        if (fade) el.style.opacity = String(1 - smooth(fade[0], fade[1], p));
      }
      copy.style.opacity = String(1 - smooth(0.15, 0.4, p));
      copy.style.transform = `translate3d(0, ${(-p * 120).toFixed(1)}px, 0)`;
      // Spec 5.2: with the living sky running behind the page, the scene fades out onto it; otherwise into #070A0F.
      const fade = smooth(0.72, 1, p);
      if (root.dataset.sky === "live") { shade.style.opacity = "0"; scene.style.opacity = String(1 - fade); }
      else { shade.style.opacity = String(fade); scene.style.opacity = ""; }
      const t = now / 1000;
      if (drift) drift.style.transform = `translateX(${(Math.sin(t / 30) * 18).toFixed(1)}px)`;
      const speed = 0.15 + 0.85 * smooth(0, 0.5, p); // revolutions per second
      for (const r of rotors) { r.angle = (r.angle + speed * 360 * dt) % 360; r.el.style.transform = `rotate(${r.angle.toFixed(1)}deg)`; }
      root.toggleAttribute("data-over-hero", p < 0.98);

      if (ctx) {
        const want = Math.round(28 + 52 * smooth(0, 0.6, p));
        while (packets.length < want) packets.push(spawn(packets.length < 10));
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = "#22d3ee";
        ctx.shadowColor = "rgba(34, 211, 238, 0.9)";
        ctx.shadowBlur = 8;
        for (let i = packets.length - 1; i >= 0; i--) {
          const k = packets[i];
          k.life += dt;
          k.y -= k.vy * (1 + p * 1.2) * dt;
          const x = k.x + Math.sin(t * 0.8 + k.phase) * 6;
          const a = Math.min(1, k.life / 1.2, (k.ttl - k.life) / 1.5);
          if (a <= 0 || k.y < -10) { if (packets.length > want) packets.splice(i, 1); else packets[i] = spawn(false); continue; }
          ctx.globalAlpha = a * 0.85;
          ctx.fillRect(x, k.y, k.size, k.size);
        }
        ctx.globalAlpha = 1;
      }
      if (window.__dusk) window.__dusk.frames++;
      if (visible && document.visibilityState === "visible") raf = requestAnimationFrame(frame); else raf = 0;
    };
    const start = () => { if (!raf && visible && document.visibilityState === "visible") { last = performance.now(); raf = requestAnimationFrame(frame); } };
    const stop = () => { cancelAnimationFrame(raf); raf = 0; };

    resize();
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) start(); else { stop(); root.removeAttribute("data-over-hero"); } });
    io.observe(hero);
    const onVisibility = () => (document.visibilityState === "visible" ? start() : stop());
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("resize", resize);
    start();

    // Smooth scrolling on desktops with a fine pointer only (spec 5.0 section 9).
    let lenis: { raf: (t: number) => void; destroy: () => void } | null = null, lenisRaf = 0;
    let onAnchor: ((e: MouseEvent) => void) | null = null;
    if (matchMedia("(min-width: 1024px) and (pointer: fine)").matches) {
      import("lenis").then(({ default: Lenis }) => {
        // In-page links: Lenis scrolls to the target, offset only by the page's scroll-padding-top (no extra
        // offset). The browser's own smooth anchor jump is cancelled, or the two scrolls fight and land off target.
        // Focus still moves to the target, as a native jump would. The skip link keeps its native behaviour.
        const l = new Lenis({ anchors: true });
        lenis = l;
        onAnchor = (e: MouseEvent) => {
          const a = (e.target as Element | null)?.closest?.<HTMLAnchorElement>('a[href^="#"]:not(.skip-link)');
          const target = a && a.hash.length > 1 ? document.getElementById(decodeURIComponent(a.hash.slice(1))) : null;
          if (!a || !target || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
          e.preventDefault();
          // Sync Lenis with the real scroll position first: a native scroll just before the click (scrollbar, keys)
          // has not reached Lenis yet, and its target would be off by that distance.
          l.scrollTo(window.scrollY, { immediate: true, force: true });
          history.pushState(null, "", a.hash);
          if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
          target.focus({ preventScroll: true });
        };
        document.addEventListener("click", onAnchor);
        const tick = (time: number) => { l.raf(time); lenisRaf = requestAnimationFrame(tick); };
        lenisRaf = requestAnimationFrame(tick);
      });
    }
    window.__dusk = { ready: true, frames: 0 };
    return () => {
      stop(); io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(lenisRaf); lenis?.destroy();
      if (onAnchor) document.removeEventListener("click", onAnchor);
    };
  }, []);
  return null;
}
