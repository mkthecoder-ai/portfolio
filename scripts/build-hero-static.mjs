#!/usr/bin/env node
// Spec 5.0 section 9: one static composed image of the live hero scene at p = 0, for phones, reduced motion and
// no-JS. Renders site/out with the live tier, hides the copy and header, captures the stage at 1600x1000 and
// writes site/public/hero/dusk-16x10.webp (1440x900) and dusk-4x5.webp (720x900, the right half: ridge and
// rider). At most 90 KB each. Needs a fresh build; rebuild afterwards.
import { chromium } from "@playwright/test";
import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import { createStaticServer } from "./serve-out.mjs";

const OUT = "site/public/hero";
const MAX = 90 * 1024;
await mkdir(OUT, { recursive: true });
const server = await createStaticServer("site/out");
await new Promise((r) => server.listen(3150, r));
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
  await page.goto("http://localhost:3150/");
  await page.waitForFunction(() => window.__dusk?.ready === true, null, { timeout: 30_000 });
  await page.evaluate(() => document.documentElement.classList.add("hero-capture"));
  await page.waitForTimeout(2500); // a few packets in the air
  const png = await page.locator(".dusk-stage").screenshot();
  const write = async (name, pipeline) => {
    let q = 78, buf;
    do { buf = await pipeline().webp({ quality: q, effort: 6 }).toBuffer(); q -= 6; } while (buf.length > MAX && q > 30);
    if (buf.length > MAX) throw new Error(`${name}: ${buf.length} bytes, over ${MAX}`);
    await sharp(buf).toFile(`${OUT}/${name}`);
    console.log(`hero-static: ${name} ${(buf.length / 1024).toFixed(1)} kB (q${q + 6})`);
  };
  await write("dusk-16x10.webp", () => sharp(png).resize(1440, 900));
  await write("dusk-4x5.webp", () => sharp(png).extract({ left: 800, top: 0, width: 800, height: 1000 }).resize(720, 900));
} finally {
  await browser.close();
  server.close();
}
