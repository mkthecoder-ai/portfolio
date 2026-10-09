import { test, expect, revealAll } from "./fixtures";

for (const width of [320, 360, 640, 768, 1024, 1440]) {
  test(`no horizontal scrolling at ${width}px`, async ({ page, isMobile }) => {
    test.skip(isMobile, "viewport is set explicitly here");
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await revealAll(page);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, `page is ${overflow}px wider than the viewport`).toBeLessThanOrEqual(0);
  });
}
