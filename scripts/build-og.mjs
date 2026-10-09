#!/usr/bin/env node
// Spec 5.2: site/public/og.png (1200×630) from the painted hero (the static composition, scene only), with the
// mark, the name, the role and the headline on a translucent panel, as on the site. Geist is embedded, so no
// system fonts are used.
import { chromium } from "playwright";
import { readFile } from "node:fs/promises";

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const b64 = async (p) => (await readFile(p)).toString("base64");
const brand = JSON.parse(await readFile("site/src/lib/brand.json", "utf8"));
const sans = await b64("node_modules/geist/dist/fonts/geist-sans/Geist-Variable.woff2");
const mono = await b64("node_modules/geist/dist/fonts/geist-mono/GeistMono-Variable.woff2");
const scene = await b64("site/public/hero/dusk-16x10.webp");
const mark = await b64("site/public/favicon.svg");

const html = `<!doctype html><html><head><style>
@font-face { font-family: G; src: url(data:font/woff2;base64,${sans}) format("woff2"); font-weight: 100 900; }
@font-face { font-family: GM; src: url(data:font/woff2;base64,${mono}) format("woff2"); font-weight: 100 900; }
* { margin: 0; box-sizing: border-box; }
body { width: 1200px; height: 630px; position: relative; overflow: hidden; color: #f8f6fd; font-family: G;
  background: #2b2350 url(data:image/webp;base64,${scene}) 72% 62% / cover no-repeat; }
.panel { position: absolute; left: 56px; top: 56px; bottom: 56px; width: 744px; padding: 44px 48px; display: flex; flex-direction: column; justify-content: space-between;
  border-radius: 16px; border: 1px solid rgba(248,250,252,.1); background: rgba(13,10,30,.72); backdrop-filter: blur(14px); }
.brand { display: flex; align-items: center; gap: 16px; }
.brand img { width: 56px; height: 56px; }
.name { font-size: 34px; font-weight: 600; letter-spacing: -0.02em; line-height: 1.1; }
.handle { font-family: GM; font-size: 16px; letter-spacing: .08em; color: #d6d0ee; }
h1 { font-size: 50px; font-weight: 600; letter-spacing: -0.035em; line-height: 1.08; }
h1 span { display: block; white-space: nowrap; } /* one sentence per line, as on the site */
.role { font-family: GM; font-size: 17px; letter-spacing: .08em; text-transform: uppercase; color: #d6d0ee; margin-bottom: 18px; }
.url { font-family: GM; font-size: 20px; color: #22d3ee; }
</style></head><body>
<div class="panel">
  <div class="brand"><img src="data:image/svg+xml;base64,${mark}" alt=""><div><p class="name">${esc(brand.name)}</p><p class="handle">${esc(brand.handle)}</p></div></div>
  <div><p class="role">${esc(brand.role)}</p><h1>${brand.headline.split(/(?<=\.)\s+/).map((s) => `<span>${esc(s)}</span>`).join("")}</h1></div>
  <p class="url">${esc(new URL(brand.url).host)}</p>
</div>
</body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.setContent(html, { waitUntil: "load" });
await page.evaluate(() => document.fonts.ready);
const overflow = await page.evaluate(() => [...document.querySelectorAll("h1, h1 span, .name, .role, .url, .handle")].filter((el) => el.scrollWidth > el.clientWidth).map((el) => el.textContent));
if (overflow.length) throw new Error(`og: text overflows: ${overflow.join(", ")}`);
await page.screenshot({ path: "site/public/og.png" });
await browser.close();
console.log("og: wrote site/public/og.png");
