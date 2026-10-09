"use client";
// Spec 5.2: the living background's mount point. The canvas sits fixed behind the page; the engine (its own
// lazy chunk) loads only after the page has loaded and the browser is idle, and never with reduced motion
// (the sections' static painted gradients stand in).
import { useEffect, useRef } from "react";

export function LivingSky() {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let stop: (() => void) | undefined;
    let cancelled = false;
    const go = () => {
      import("./engine").then(({ startSky }) => { if (!cancelled && canvas.current) stop = startSky(canvas.current); });
    };
    const idle = () => { if ("requestIdleCallback" in window) requestIdleCallback(go, { timeout: 1500 }); else setTimeout(go, 200); };
    if (document.readyState === "complete") idle(); else window.addEventListener("load", idle, { once: true });
    return () => { cancelled = true; stop?.(); window.removeEventListener("load", idle); };
  }, []);
  return <div className="sky" aria-hidden="true"><canvas ref={canvas} className="sky-canvas" /></div>;
}
