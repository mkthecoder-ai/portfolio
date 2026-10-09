"use client";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { NavItem } from "@/lib/types";
import { useActiveSection, useScrolled } from "@/lib/hooks";

const noop = () => () => {};
/** False in the server HTML (what no-JS visitors get), true once hydrated. */
const useHydrated = () => useSyncExternalStore(noop, () => true, () => false);

export function Header({ items, observeIds, name, handle, resumeHref }: {
  items: NavItem[]; observeIds: string[]; name: string; handle: string; resumeHref: string | null;
}) {
  const active = useActiveSection(observeIds);
  const compact = useScrolled(8);
  const hydrated = useHydrated();
  const [open, setOpen] = useState(false);
  const summary = useRef<HTMLElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const brand = useRef<HTMLAnchorElement>(null);
  const nav = useRef<HTMLElement>(null);

  // The mobile menu is a <details>: without JS the browser opens it as a dropdown under the header.
  // With JS it becomes a full-screen modal panel: the page behind is inert, Tab wraps, Escape closes.
  useEffect(() => {
    if (!open) return;
    const toggle = summary.current;
    const focusable = Array.from(panel.current?.querySelectorAll<HTMLElement>("a, button") ?? []);
    const background = [brand.current, nav.current, toggle, document.getElementById("main"), document.querySelector("footer"), document.querySelector(".skip-link")]
      .filter((el): el is HTMLElement => el instanceof HTMLElement);
    background.forEach((el) => { el.inert = true; });
    document.body.style.overflow = "hidden";
    focusable[0]?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setOpen(false); return; }
      if (e.key !== "Tab" || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      background.forEach((el) => { el.inert = false; });
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
      toggle?.focus();
    };
  }, [open]);

  return (
    <header className={`site-header${compact ? " is-compact" : ""}`}>
      <div className="container header-inner">
        <a ref={brand} href="#home" className="brand">
          {/* Spec 5.2: the mark (the favicon), the name large and confident, the handle as a small mono label. */}
          {/* eslint-disable-next-line @next/next/no-img-element -- a 1 kB SVG, already cached as the favicon */}
          <img src="/favicon.svg" alt="" width={32} height={32} className="brand-mark" />
          <span className="brand-text">
            <span className="brand-name">{name}<span className="sr-only"> (back to top)</span></span>
            <span className="brand-handle" aria-hidden="true">{handle}</span>
          </span>
        </a>
        <nav ref={nav} aria-label="Primary" className="nav">
          <ul>
            {items.map((item) => (
              <li key={item.id}><a href={`#${item.id}`} aria-current={active === item.id ? "location" : undefined}>{item.label}</a></li>
            ))}
            {resumeHref ? <li><a href={resumeHref} className="nav-resume" target="_blank" rel="noopener noreferrer">Resume</a></li> : null}
          </ul>
        </nav>
        <details className="menu" open={open} onToggle={(e) => setOpen(e.currentTarget.open)}>
          <summary ref={summary} className="menu-btn" aria-controls="site-menu" onClick={(e) => { e.preventDefault(); setOpen(true); }}>Menu</summary>
          <div id="site-menu" ref={panel} role={hydrated ? "dialog" : undefined} aria-modal={hydrated ? true : undefined} aria-label="Site menu"
            className={`menu-panel${open ? " is-open" : ""}`}>
            <div className="container menu-top">
              {/* eslint-disable-next-line @next/next/no-img-element -- see the brand mark above */}
              <img src="/favicon.svg" alt="" width={32} height={32} className="brand-mark" />
              <button type="button" className="menu-btn" onClick={() => setOpen(false)}>Close</button>
            </div>
            <nav aria-label="Site menu links">
              <ol className="container menu-list">
                {items.map((item, i) => (
                  <li key={item.id}>
                    <a href={`#${item.id}`} onClick={() => setOpen(false)}><span className="menu-index">{String(i + 1).padStart(2, "0")}</span>{item.label}</a>
                  </li>
                ))}
                {resumeHref ? <li><a href={resumeHref} target="_blank" rel="noopener noreferrer"><span className="menu-index">PDF</span>Resume</a></li> : null}
              </ol>
            </nav>
          </div>
        </details>
      </div>
    </header>
  );
}
