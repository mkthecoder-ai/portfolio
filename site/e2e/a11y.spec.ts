import AxeBuilder from "@axe-core/playwright";
import { test, expect, revealAll } from "./fixtures";

const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

test("the home page has no WCAG 2.2 AA violations", async ({ page }) => {
  await page.goto("/");
  await revealAll(page);
  const results = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  expect(results.violations.map((v) => `${v.id}: ${v.help} (${v.nodes.length})`)).toEqual([]);
});

test("the open mobile menu has no WCAG 2.2 AA violations", async ({ page, isMobile }) => {
  test.skip(!isMobile, "the menu button shows below 768px");
  await page.goto("/");
  await page.locator(".site-header summary", { hasText: "Menu" }).click();
  await expect(page.getByRole("dialog", { name: "Site menu" })).toBeVisible();
  const results = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  expect(results.violations.map((v) => `${v.id}: ${v.help} (${v.nodes.length})`)).toEqual([]);
});

test.describe("404", () => {
  test.use({ allowHttpErrors: true });
  test("the 404 page has no WCAG 2.2 AA violations", async ({ page }) => {
    await page.goto("/no-such-page");
    const results = await new AxeBuilder({ page }).withTags(TAGS).analyze();
    expect(results.violations.map((v) => `${v.id}: ${v.help} (${v.nodes.length})`)).toEqual([]);
  });
});
