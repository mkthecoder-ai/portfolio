#!/usr/bin/env node
// Screenshots the full page and each section at the spec's viewports, plus a reduced-motion pass and the 404.
// Writes review/<timestamp>/{<viewport>/*.png, report.json, index.html}. Needs a fresh build.
// Section shots are clipped from a full-page capture, so the sticky header and skip link never overlay them.
import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { createStaticServer } from "./serve-out.mjs";

const VIEWPORTS = [
  { name: "360", width: 360, height: 800, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
  { name: "390", width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
  { name: "768", width: 768, height: 1024, deviceScaleFactor: 1 },
  { name: "1024", width: 1024, height: 768, deviceScaleFactor: 1 },
  { name: "1440", width: 1440, height: 900, deviceScaleFactor: 1 },
  { name: "2560", width: 2560, height: 1440, deviceScaleFactor: 1 },
  { name: "1440-reduced-motion", width: 1440, height: 900, deviceScaleFactor: 1, reducedMotion: "reduce" },
];
const SECTIONS = ["home", "work", "about", "services", "stack", "certifications", "contact"];
const overflowOf = (page) => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);

const server = await createStaticServer("site/out");
await new Promise((r) => server.listen(3100, r));
const dir = join("review", new Date().toISOString().replace(/[:.]/g, "-"));
const report = [];
const shots = [];
const browser = await chromium.launch();
try {
  for (const vp of VIEWPORTS) {
    const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, isMobile: vp.isMobile ?? false, hasTouch: vp.hasTouch ?? false, deviceScaleFactor: vp.deviceScaleFactor, reducedMotion: vp.reducedMotion ?? "no-preference" });
    const page = await context.newPage();
    const errors = [];
    page.on("console", (m) => m.type() === "error" && errors.push({ text: m.text(), url: page.url() }));
    page.on("pageerror", (e) => errors.push({ text: e.message, url: page.url() }));
    await page.goto("http://localhost:3100/", { waitUntil: "networkidle" });
    const height = await page.evaluate(() => document.body.scrollHeight);
    for (let y = 0; y < height; y += vp.height / 2) { await page.evaluate((top) => window.scrollTo(0, top), y); await page.waitForTimeout(100); }
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(700);
    const out = join(dir, vp.name);
    await mkdir(out, { recursive: true });
    await page.screenshot({ path: join(out, "00-full.png"), fullPage: true });
    shots.push(`${vp.name}/00-full.png`);
    for (const [i, id] of SECTIONS.entries()) {
      const file = `${String(i + 1).padStart(2, "0")}-${id}.png`;
      const box = await page.locator(`#${id}`).evaluate((el) => { const r = el.getBoundingClientRect(); return { y: r.top + window.scrollY, height: r.height }; });
      await page.screenshot({ path: join(out, file), fullPage: true, clip: { x: 0, y: box.y, width: vp.width, height: box.height } });
      shots.push(`${vp.name}/${file}`);
    }
    const overflowHome = await overflowOf(page);
    await page.goto("http://localhost:3100/no-such-page");
    await page.screenshot({ path: join(out, "99-404.png") });
    shots.push(`${vp.name}/99-404.png`);
    const overflow404 = await overflowOf(page);
    // The 404 document's own "Failed to load resource" line is expected; anything else counts.
    const unexpected = errors.filter((e) => !(e.url.endsWith("/no-such-page") && /status of 404/.test(e.text))).map((e) => e.text);
    report.push({ viewport: vp.name, overflowHome, overflow404, errors: unexpected });
    await context.close();
  }
} finally {
  await browser.close();
  server.close();
}
await writeFile(join(dir, "report.json"), JSON.stringify(report, null, 2));
await writeFile(join(dir, "index.html"), `<!doctype html><meta charset="utf-8"><title>Review ${dir}</title><body style="background:#070a0f;color:#f8fafc;font:14px system-ui;padding:24px">${shots.map((s) => `<figure style="margin:0 0 32px"><figcaption style="margin-bottom:8px;color:#94a3b8">${s}</figcaption><img src="${s}" style="max-width:100%;border:1px solid #333"></figure>`).join("")}</body>`);
console.log(`review: ${shots.length} screenshots in ${dir} (open ${dir}/index.html)`);
for (const r of report) console.log(`  ${r.viewport}: overflow home ${r.overflowHome}px, 404 ${r.overflow404}px, ${r.errors.length} console error(s)`);
if (report.some((r) => r.overflowHome > 0 || r.overflow404 > 0 || r.errors.length)) process.exit(1);
