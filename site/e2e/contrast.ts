import type { Page } from "@playwright/test";
import sharp from "sharp";

// WCAG 2 relative luminance and contrast ratio.
export const lum = (r: number, g: number, b: number) => {
  const c = [r, g, b].map((v) => { const s = v / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
export const ratio = (a: number, b: number) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);

interface Run { text: string; x: number; y: number; w: number; h: number; color: number[]; alpha: number; large: boolean }

/**
 * Spec 5.2: every visible line of text (outside the hero, which has its own test) against what is actually painted
 * behind it right now: the living sky, the panels, the silhouettes. Text is made transparent, the page is captured,
 * and the brightest 5% of the pixels behind each line (the worst case for light text) is compared with the text
 * colour. Large text (>= 24px, or >= 18.66px bold) needs 3:1, the rest 4.5:1. Returns the failures.
 */
export async function textContrastFailures(page: Page, where: string): Promise<string[]> {
  const runs: Run[] = await page.evaluate(() => {
    const out: Run[] = [];
    const headerBottom = document.querySelector(".site-header")!.getBoundingClientRect().bottom;
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      const text = n.textContent?.trim();
      const el = n.parentElement;
      if (!text || !el || el.closest(".sr-only, [hidden], #home, .menu-panel, .skip-link, script, style, noscript")) continue;
      const cs = getComputedStyle(el);
      if (cs.visibility !== "visible") continue;
      let opacity = 1;
      for (let a: Element | null = el; a; a = a.parentElement) opacity *= Number(getComputedStyle(a).opacity);
      if (opacity < 0.99) continue;
      const inHeader = !!el.closest(".site-header");
      const m = cs.color.match(/[\d.]+/g)!.map(Number);
      const size = parseFloat(cs.fontSize), weight = Number(cs.fontWeight);
      const range = document.createRange(); range.selectNodeContents(n);
      for (const r of range.getClientRects()) {
        if (r.width < 2 || r.height < 2) continue;
        if (r.top < (inHeader ? 0 : headerBottom) || r.bottom > innerHeight || r.left < 0 || r.right > innerWidth) continue;
        out.push({ text: text.slice(0, 32), x: r.x, y: r.y, w: r.width, h: r.height, color: m.slice(0, 3), alpha: m[3] ?? 1, large: size >= 24 || (size >= 18.66 && weight >= 700) });
      }
    }
    return out;
  });
  const style = await page.addStyleTag({ content: "body * { color: transparent !important; -webkit-text-fill-color: transparent !important; text-shadow: none !important; }" });
  const shot = await sharp(await page.screenshot()).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  await style.evaluate((s) => (s as HTMLStyleElement).remove());
  const { data, info } = shot;
  // Screenshots are in device pixels; text boxes are in CSS pixels.
  const k = info.width / (await page.evaluate(() => window.innerWidth));
  const failures: string[] = [];
  for (const r of runs) {
    const ls: number[] = [];
    let br = 0, bg = 0, bb = 0, worst = -1;
    for (let y = Math.max(0, Math.round(r.y * k)); y < Math.min(info.height, Math.round((r.y + r.h) * k)); y += 2) {
      for (let x = Math.max(0, Math.round(r.x * k)); x < Math.min(info.width, Math.round((r.x + r.w) * k)); x += 2) {
        const i = (info.width * y + x) * 3;
        const l = lum(data[i], data[i + 1], data[i + 2]);
        ls.push(l);
        if (l > worst) { worst = l; br = data[i]; bg = data[i + 1]; bb = data[i + 2]; }
      }
    }
    if (!ls.length) continue;
    ls.sort((a, b) => a - b);
    const back = ls[Math.floor(ls.length * 0.95)];
    // Semi-transparent text colour: blend it over the brightest backdrop.
    const fg = r.color.map((c, i) => c * r.alpha + [br, bg, bb][i] * (1 - r.alpha));
    const cr = ratio(lum(fg[0], fg[1], fg[2]), back);
    if (cr < (r.large ? 3 : 4.5)) failures.push(`"${r.text}" at ${where}: ${cr.toFixed(2)}:1 (needs ${r.large ? 3 : 4.5})`);
  }
  return failures;
}

/** Scroll positions that walk through one stage, a little over a screen at a time. */
export async function stagePositions(page: Page, stage: number): Promise<number[]> {
  return page.evaluate((n) => {
    const els = [...document.querySelectorAll(`[data-stage="${n}"]`)];
    const top = Math.min(...els.map((e) => e.getBoundingClientRect().top)) + scrollY;
    const bottom = Math.max(...els.map((e) => e.getBoundingClientRect().bottom)) + scrollY;
    const max = document.documentElement.scrollHeight - innerHeight;
    const out: number[] = [];
    for (let y = Math.max(0, top - innerHeight * 0.3); y < bottom - innerHeight * 0.3; y += innerHeight * 0.75) out.push(Math.round(Math.min(y, max)));
    return [...new Set(out)];
  }, stage);
}
