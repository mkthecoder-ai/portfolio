import { test, expect } from "./fixtures";

test.describe("desktop header", () => {
  test.skip(({ isMobile }) => isMobile, "desktop only");

  test("each link goes to its section and is marked current in the accent", async ({ page }) => {
    await page.goto("/");
    const nav = page.getByRole("navigation", { name: "Primary" });
    for (const label of ["Work", "About", "Play"]) {
      const link = nav.getByRole("link", { name: label, exact: true });
      await link.click();
      await expect(page.locator((await link.getAttribute("href"))!)).toBeInViewport();
      await expect(link).toHaveAttribute("aria-current", "location");
    }
    // Polls: the colour eases in over 200ms.
    await expect(nav.getByRole("link", { name: "Play", exact: true })).toHaveCSS("color", "rgb(34, 211, 238)");
  });

  test("lists Work, About and Play plus the Resume button", async ({ page }) => {
    await page.goto("/");
    const nav = page.getByRole("navigation", { name: "Primary" });
    await expect(nav.getByRole("link")).toHaveText(["Work", "About", "Play", "Resume"]);
  });

  test("the Resume button opens the PDF in a new tab", async ({ page }) => {
    await page.goto("/");
    const resume = page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: "Resume" });
    await expect(resume).toHaveAttribute("href", "/Manoj_Kumar_M_Resume.pdf");
    await expect(resume).toHaveAttribute("target", "_blank");
    await expect(resume).toHaveAttribute("rel", "noopener noreferrer");
  });

  test("compacts from 72px to 56px with a hairline once scrolled", async ({ page }) => {
    await page.goto("/");
    const header = page.locator(".site-header");
    await expect(header.locator(".header-inner")).toHaveCSS("height", "72px");
    await page.mouse.wheel(0, 300);
    await expect(header).toHaveClass(/is-compact/);
    await expect(header.locator(".header-inner")).toHaveCSS("height", "56px");
  });

  test("shows the full nav from 768px and the Menu button below that", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 900 });
    await page.goto("/");
    await expect(page.getByRole("navigation", { name: "Primary" })).toBeVisible();
    await expect(page.locator(".site-header summary", { hasText: "Menu" })).toBeHidden();
    await page.setViewportSize({ width: 767, height: 900 });
    await expect(page.getByRole("navigation", { name: "Primary" })).toBeHidden();
    await expect(page.locator(".site-header summary", { hasText: "Menu" })).toBeVisible();
  });
});

test.describe("mobile menu", () => {
  test.skip(({ isMobile }) => !isMobile, "mobile only");

  test("keyboard focus stays inside the open menu", async ({ page }) => {
    await page.goto("/");
    await page.locator(".site-header summary", { hasText: "Menu" }).click();
    const dialog = page.getByRole("dialog", { name: "Site menu" });
    for (let i = 0; i < 12; i++) {
      await page.keyboard.press("Tab");
      expect(await dialog.evaluate((d) => d.contains(document.activeElement)), `Tab ${i + 1}`).toBe(true);
    }
  });

  test("opens, locks scrolling, closes on Escape and returns focus", async ({ page }) => {
    await page.goto("/");
    const button = page.locator(".site-header summary", { hasText: "Menu" });
    await button.click();
    const dialog = page.getByRole("dialog", { name: "Site menu" });
    await expect(dialog).toBeVisible();
    expect(await page.evaluate(() => document.body.style.overflow)).toBe("hidden");
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(button).toBeFocused();
  });

  test("a menu link closes the menu and goes to the section", async ({ page }) => {
    await page.goto("/");
    await page.locator(".site-header summary", { hasText: "Menu" }).click();
    await page.getByRole("dialog", { name: "Site menu" }).getByRole("link", { name: /Play/ }).click();
    await expect(page.getByRole("dialog", { name: "Site menu" })).toBeHidden();
    await expect(page.locator("#play")).toBeInViewport();
  });

  test("the menu offers the résumé in a new tab", async ({ page }) => {
    await page.goto("/");
    await page.locator(".site-header summary", { hasText: "Menu" }).click();
    const resume = page.getByRole("dialog", { name: "Site menu" }).getByRole("link", { name: /Resume/ });
    await expect(resume).toHaveAttribute("href", "/Manoj_Kumar_M_Resume.pdf");
    await expect(resume).toHaveAttribute("target", "_blank");
  });
});

test("the brand link takes its name from its content (no aria-label that hides the visible text)", async ({ page }) => {
  await page.goto("/");
  const brand = page.locator(".site-header .brand");
  await expect(brand).not.toHaveAttribute("aria-label", /.*/);
  await expect(page.getByRole("link", { name: "Manoj Kumar (back to top)", exact: true })).toHaveAttribute("href", "#home");
});

test.describe("keyboard navigation to a section (WCAG 2.4.7, 2.4.11)", () => {
  test.skip(({ isMobile }) => isMobile, "desktop nav only");

  const state = (page: import("@playwright/test").Page, id: string) => page.evaluate((i) => {
    const s = document.getElementById(i)!, panel = s.querySelector(".sky-panel")!;
    const header = document.querySelector(".site-header")!.getBoundingClientRect().bottom;
    return { focused: document.activeElement === s, visible: s.matches(":focus-visible"),
      outline: getComputedStyle(panel).outlineStyle, top: panel.getBoundingClientRect().top, header };
  }, id);

  test("Enter on a nav link moves focus to the section, shows where it landed, below the header", async ({ page }) => {
    await page.goto("/");
    await page.waitForFunction(() => window.__dusk?.ready === true);
    const nav = page.getByRole("navigation", { name: "Primary" });
    for (const [label, id] of [["About", "about"], ["Play", "play"]] as const) {
      await nav.getByRole("link", { name: label, exact: true }).focus();
      await page.keyboard.press("Enter");
      await expect.poll(async () => (await state(page, id)).focused).toBe(true);
      await page.waitForTimeout(1500); // the smooth scroll settles
      const s = await state(page, id);
      expect(s.visible, `${id} focus is visible`).toBe(true);
      expect(s.outline, `${id} panel shows the focus ring`).not.toBe("none");
      expect(s.top, `${id} not under the header`).toBeGreaterThanOrEqual(s.header);
    }
    // Tab continues from the section: the next focus stop comes after it in the document, not back at the top.
    await page.keyboard.press("Tab");
    expect(await page.evaluate(() => !!(document.getElementById("play")!.compareDocumentPosition(document.activeElement!) & Node.DOCUMENT_POSITION_FOLLOWING))).toBe(true);
  });

  test("a mouse click lands on the section without a focus ring", async ({ page }) => {
    await page.goto("/");
    await page.waitForFunction(() => window.__dusk?.ready === true);
    await page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: "About", exact: true }).click();
    await page.waitForTimeout(1500);
    const s = await state(page, "about");
    expect(s.outline).toBe("none");
    expect(s.top).toBeGreaterThanOrEqual(s.header);
  });
});
