import { test as base, expect } from "@playwright/test";

// Deliberately not using the guard fixture: this test blocks the site's own scripts.
base("content shows even when the JS bundle fails to load (JS on, chunks blocked)", async ({ page }) => {
  await page.route("**/_next/static/**/*.js", (route) => route.abort());
  await page.goto("/");
  await expect.poll(async () => page.locator(".reveal, [data-hero-item]").evaluateAll((els) => els.filter((el) => getComputedStyle(el).opacity !== "1").length), { timeout: 6000 }).toBe(0);
});
