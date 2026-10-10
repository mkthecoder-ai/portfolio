import { test, expect } from "./fixtures";

test.use({ javaScriptEnabled: false });

test("every section is readable without JavaScript", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("h1").first()).toBeVisible();
  for (const id of ["work", "about", "services", "stack", "certifications", "contact"]) {
    const head = page.locator(`#${id} .section-head`);
    await head.scrollIntoViewIfNeeded();
    expect(await head.evaluate((el) => getComputedStyle(el).opacity), `#${id}`).toBe("1");
  }
});

test("the mobile menu opens and its links work without JavaScript", async ({ page, isMobile }) => {
  test.skip(!isMobile, "the Menu control shows below 768px");
  await page.goto("/");
  await page.locator(".site-header").getByText("Menu", { exact: true }).click();
  const menu = page.locator("#site-menu");
  await expect(menu).toBeVisible();
  await expect(menu.getByRole("link")).toHaveText([/Work/, /About/, /Play/, /Resume/]);
  await menu.getByRole("link", { name: /Play/ }).click();
  await expect(page.locator("#play")).toBeInViewport();
  // Tapping Menu again closes it.
  await page.locator(".site-header").getByText("Menu", { exact: true }).click();
  await expect(menu).toBeHidden();
});
