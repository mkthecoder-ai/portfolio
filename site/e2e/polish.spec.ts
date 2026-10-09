import { test, expect, revealAll } from "./fixtures";

test.describe("review round 1", () => {
  test.skip(({ isMobile }) => isMobile, "sets its own viewport widths");

  for (const width of [360, 768, 1440]) {
    test(`certification codes never break inside, at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/");
      for (const code of await page.locator("#certifications .cert-code").all()) {
        const lines = await code.evaluate((el) => new Set([...el.getClientRects()].map((r) => Math.round(r.top))).size);
        expect(lines, await code.textContent() ?? "").toBe(1);
      }
    });

    test(`body copy stays within 68ch, at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/");
      await revealAll(page);
      const wide = await page.locator("main p").evaluateAll((els) => els.filter((el) => (el.textContent ?? "").length > 80).map((el) => {
        const probe = document.createElement("span");
        probe.style.cssText = "position:absolute;visibility:hidden;width:68ch";
        el.appendChild(probe);
        const limit = probe.getBoundingClientRect().width;
        probe.remove();
        return { text: (el.textContent ?? "").slice(0, 40), width: Math.round(el.getBoundingClientRect().width), limit: Math.round(limit) };
      }).filter((p) => p.width > p.limit + 1));
      expect(wide).toEqual([]);
    });
  }

  test("the footer has one hairline above the wordmark, not two", async ({ page }) => {
    await page.goto("/");
    const borders = await page.evaluate(() => {
      const f = document.querySelector(".site-footer")!;
      const w = document.querySelector(".footer-wordmark")!;
      return [getComputedStyle(f).borderTopStyle, getComputedStyle(w).borderTopStyle].filter((s) => s !== "none").length;
    });
    // Spec 5.2: the footer is a panel (its own border frames it), so at most one line; never two stacked.
    expect(borders).toBeLessThanOrEqual(1);
  });
});
