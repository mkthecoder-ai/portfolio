import { test, expect } from "./fixtures";
import sharp from "sharp";
import { lum, ratio } from "./contrast";

// Spec 5.1: every text/background pair passes WCAG AA, measured against the real painted art behind the text.
// Text is made transparent, the area behind each block is captured, and the brightest 5% of those pixels (the
// worst case for light text) is compared with the text colour. Large text (>= 24px) needs 3:1, the rest 4.5:1.

/** Measures every hero text block against what is actually painted behind it. */
async function checkHeroContrast(page: import("@playwright/test").Page, where: string) {
  const blocks = await page.evaluate(() => {
    const sel = [".dusk-name", ".dusk-role", ".dusk-line", ".dusk-sub"];
    return sel.flatMap((s) => [...document.querySelectorAll<HTMLElement>(`#home ${s}`)]).map((el) => {
      // The text's own extent (a block element's box can be much wider than its words).
      const range = document.createRange(); range.selectNodeContents(el);
      const r = range.getBoundingClientRect(); const cs = getComputedStyle(el);
      const m = cs.color.match(/\d+/g)!.map(Number);
      return { name: `${el.className}: ${el.textContent?.trim().slice(0, 24)}`, x: r.x, y: r.y, w: r.width, h: r.height, color: m.slice(0, 3), large: parseFloat(cs.fontSize) >= 24 };
    });
  });
  await page.addStyleTag({ content: "#home .dusk-name, #home .dusk-role, #home .dusk-line, #home .dusk-sub { color: transparent !important; }" });
  const shot = await sharp(await page.screenshot()).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const png = { data: shot.data, width: shot.info.width, height: shot.info.height };
  // Screenshots are in device pixels; element boxes are in CSS pixels.
  const k = png.width / (await page.evaluate(() => window.innerWidth));
  await page.evaluate(() => document.querySelectorAll("style").forEach((s) => { if (s.textContent?.includes("color: transparent !important")) s.remove(); }));
  for (const b of blocks) {
    const ls: number[] = [];
    for (let y = Math.max(0, Math.round(b.y * k)); y < Math.min(png.height, Math.round((b.y + b.h) * k)); y += 2) {
      for (let x = Math.max(0, Math.round(b.x * k)); x < Math.min(png.width, Math.round((b.x + b.w) * k)); x += 2) {
        const i = (png.width * y + x) * 3;
        ls.push(lum(png.data[i], png.data[i + 1], png.data[i + 2]));
      }
    }
    ls.sort((a, c) => a - c);
    const worst = ls[Math.floor(ls.length * 0.95)];
    const r = ratio(lum(b.color[0], b.color[1], b.color[2]), worst);
    expect(r, `${b.name} at ${where}: ${r.toFixed(2)}:1`).toBeGreaterThanOrEqual(b.large ? 3 : 4.5);
  }
}

test.describe("hero text contrast over the painted scene", () => {
  test.skip(({ isMobile }) => isMobile, "desktop sets its own widths");

  for (const [w, h] of [[768, 1024], [1024, 768], [1440, 900], [2560, 1080]] as const) {
    test(`AA at ${w}x${h}, at rest and as the headline starts to lift`, async ({ page }) => {
      await page.setViewportSize({ width: w, height: h });
      await page.goto("/");
      await page.waitForFunction(() => window.__dusk?.ready && [...document.querySelectorAll(".painted img")].every((i) => (i as HTMLImageElement).complete));
      const track = await page.evaluate(() => document.getElementById("home")!.offsetHeight - innerHeight);
      for (const p of [0, 0.12]) {
        await page.evaluate((y) => window.scrollTo(0, y), Math.round(p * track));
        await page.waitForTimeout(700);
        await checkHeroContrast(page, `${w}px p=${p}`);
      }
    });
  }
});

test("AA on phones, over the static composed image", async ({ page, isMobile }) => {
  test.skip(!isMobile, "mobile");
  await page.goto("/");
  await expect.poll(() => page.locator(".dusk-static img").evaluate((i: HTMLImageElement) => i.complete && i.naturalWidth > 0)).toBe(true);
  await checkHeroContrast(page, "phone static");
});
