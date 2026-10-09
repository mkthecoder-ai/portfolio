import { test, expect } from "./fixtures";

test("About sits between Work and Services, with the label and three sentences", async ({ page }) => {
  await page.goto("/");
  const order = await page.locator("main > section").evaluateAll((els) => els.map((e) => e.id));
  expect(order.slice(0, 5)).toEqual(["home", "work", "about", "play", "services"]);
  const about = page.locator("#about");
  await expect(about.locator(".label")).toHaveText("02 / About");
  await expect(about.getByRole("heading", { level: 2, name: "About" })).toHaveClass(/sr-only/);
  // Spec 5.3: the same three sentences, now as short paragraphs.
  const text = (await about.locator(".about-text p").allTextContents()).join(" ");
  expect(text.split(/(?<=[.!?])\s+/).filter(Boolean)).toHaveLength(3);
  expect(text).toMatch(/^I started in DevOps in 2018/);
});

test("Services shows the six capability cards, which are not interactive", async ({ page }) => {
  await page.goto("/");
  const cards = page.locator("#services .service");
  await expect(cards.locator("h3")).toHaveText([
    "Azure Cloud & API Management", "Kubernetes Platforms", "Infrastructure as Code", "CI/CD Engineering", "DevSecOps", "Observability & Cost",
  ]);
  await expect(page.locator("#services a, #services button")).toHaveCount(0);
});
