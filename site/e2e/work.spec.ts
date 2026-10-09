import { test, expect } from "./fixtures";

test("shows four rows with title, one-line problem and stack tags, and no links", async ({ page }) => {
  await page.goto("/");
  const rows = page.locator("#work .work-row");
  await expect(rows.locator("h3")).toHaveText([
    "Modular, multi-state Terraform for Azure", "Secure-by-default delivery pipelines",
    "Scaling AKS networking with CNI Overlay and Cilium", "API publishing with Azure API Management",
  ]);
  await expect(rows.nth(1).locator(".work-problem")).toHaveText("Scanners that only produce reports get ignored, and vulnerabilities reach production anyway.");
  await expect(rows.nth(0).locator(".tag")).toHaveText(["Terraform", "Azure Verified Modules", "Remote state", "Azure"]);
  await expect(page.locator("#work a")).toHaveCount(0);
  await expect(page.locator("#work-cni")).toHaveCount(1);
});

test("keeps AURA and every DRAFT constraint off the page", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("body")).not.toContainText("AURA");
  for (const text of ["A change to one environment must not be able to affect another.", "Pod growth must not consume VNet address space."]) {
    await expect(page.locator("body")).not.toContainText(text);
  }
});
