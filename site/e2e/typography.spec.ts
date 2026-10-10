import { test, expect } from "./fixtures";

// Spec 5.3: one type scale (tokens.css) and a label row (icon + number) above every section heading.

const STEPS = ["--fs-h1", "--fs-h2", "--fs-title", "--fs-body", "--fs-small", "--fs-label", "--fs-tag", "--fs-brand"];

test("every piece of text uses a step of the type scale, and nothing is smaller than 12px", async ({ page }) => {
  await page.goto("/");
  const { allowed, used } = await page.evaluate((steps) => {
    const probe = document.createElement("span");
    document.body.append(probe);
    const allowed = steps.map((s) => { probe.style.fontSize = `var(${s})`; return parseFloat(getComputedStyle(probe).fontSize); });
    probe.remove();
    const used: { text: string; size: number }[] = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      const el = n.parentElement;
      if (!n.textContent?.trim() || !el || el.closest("script, style, svg, .sr-only")) continue;
      used.push({ text: n.textContent.trim().slice(0, 30), size: parseFloat(getComputedStyle(el).fontSize) });
    }
    return { allowed, used };
  }, STEPS);
  const off = used.filter((u) => !allowed.some((a) => Math.abs(a - u.size) < 0.5));
  expect(off, off.map((o) => `${o.text}: ${o.size}px`).join("\n")).toEqual([]);
  expect(Math.min(...used.map((u) => u.size))).toBeGreaterThanOrEqual(12);
});

test("each section has a label row (icon, then number and name) above a 32-48px heading", async ({ page, isMobile }) => {
  await page.goto("/");
  const rows = await page.locator("main > section:not(#home)").evaluateAll((sections) => sections.map((s) => {
    const label = s.querySelector(".section-head .label")!;
    const icon = label.querySelector("svg")!;
    const h2 = s.querySelector("h2")!;
    return {
      id: s.id, text: label.textContent!.trim(), iconSize: icon.getBoundingClientRect().width, iconH: icon.getBoundingClientRect().height,
      iconMid: icon.getBoundingClientRect().top + icon.getBoundingClientRect().height / 2,
      textMid: (() => { const r = document.createRange(); r.selectNodeContents(label.lastChild!); const b = r.getBoundingClientRect(); return b.top + b.height / 2; })(), stroke: icon?.getAttribute("stroke-width"),
      iconFirst: label.firstElementChild === icon, h2: parseFloat(getComputedStyle(h2).fontSize), srOnly: h2.classList.contains("sr-only"),
      above: label.getBoundingClientRect().bottom <= h2.getBoundingClientRect().top + 1 || h2.classList.contains("sr-only"),
    };
  }));
  expect(rows).toHaveLength(7);
  for (const r of rows) {
    // Spec 5.4: section icons are 22px on desktop, 20px on phones, square, centred on the label text.
    expect(r.iconSize, r.id).toBe(isMobile ? 20 : 22);
    expect(r.iconH, r.id).toBe(r.iconSize);
    expect(Math.abs(r.iconMid - r.textMid), `${r.id} icon centred on the label`).toBeLessThanOrEqual(1);
    expect(r.stroke, r.id).toBe("1.5");
    expect(r.iconFirst, r.id).toBe(true);
    expect(r.above, r.id).toBe(true);
    if (!r.srOnly) { expect(r.h2, r.id).toBeGreaterThanOrEqual(32); expect(r.h2, r.id).toBeLessThanOrEqual(48); }
  }
});
