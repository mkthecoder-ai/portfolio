import { test, expect } from "./fixtures";

test("shows the two stat cards with the numbers in the accent", async ({ page }) => {
  await page.goto("/");
  const stats = page.locator("#experience .stat");
  await expect(stats).toHaveCount(2);
  await expect(stats.nth(0)).toContainText("Since 2018");
  await expect(stats.nth(0)).toContainText("Building on Azure");
  await expect(stats.nth(1)).toContainText("3");
  await expect(stats.nth(1)).toContainText("Certifications");
  for (const i of [0, 1]) {
    expect(await stats.nth(i).locator(".stat-number").evaluate((el) => getComputedStyle(el).color)).toBe("rgb(34, 211, 238)");
  }
});

test("lists education then the three employers, oldest first", async ({ page }) => {
  await page.goto("/");
  const stops = page.locator("#experience .tl-stop");
  await expect(stops.locator("h3")).toHaveText(["Don Bosco Institute of Technology, Bengaluru", "Cubespace Technologies", "Unified Softech", "CNH Industrial"]);
  await expect(stops.nth(0)).toContainText("B.E., Electronics & Communication");
  await expect(stops.nth(1)).toContainText("Feb 2018 – Sep 2019");
  await expect(stops.nth(3)).toContainText("Software Engineer II, DevOps & Platform Engineering");
  await expect(stops.nth(3)).toContainText("Software Engineer I, DevOps Engineering");
  await expect(stops.nth(3).locator(".tl-bullets li")).toHaveCount(6); // spec 5.3: the résumé's six capability bullets
});
