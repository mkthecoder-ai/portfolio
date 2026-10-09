import { test, expect } from "./fixtures";

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("shows every reveal item immediately, without scrolling (spec: content is visible immediately)", async ({ page }) => {
    await page.goto("/");
    const reveals = page.locator(".reveal");
    expect(await reveals.count()).toBeGreaterThan(0);
    const opacities = await reveals.evaluateAll((els) => els.map((el) => getComputedStyle(el).opacity));
    expect(opacities.every((o) => o === "1"), opacities.join(",")).toBe(true);
  });
});
