import { test, expect } from "./fixtures";

test("shows the eight groups in order, with the lead", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#stack [role=group] h3")).toHaveText(["Cloud", "Containers", "Infrastructure as Code", "CI/CD", "Networking", "Security", "Observability", "Languages"]);
  await expect(page.locator("#stack .lead-muted")).toHaveText("Grouped by area and ordered by depth.");
});

test("chips are plain logo + name, with no buttons, links or popovers (spec 3.1)", async ({ page }) => {
  await page.goto("/");
  const stack = page.locator("#stack");
  await expect(stack.locator("button, a, [popover], [tabindex]")).toHaveCount(0);
  const chips = stack.locator(".chip");
  await expect(chips).toHaveCount(51);
  const withoutIcon = await chips.evaluateAll((els) => els.filter((el) => !el.querySelector("svg[aria-hidden], [aria-hidden] svg")).map((el) => el.textContent));
  expect(withoutIcon).toEqual([]);
  await expect(stack.getByText("Jenkins", { exact: true })).toBeVisible();
  await expect(stack.getByText("Terraform", { exact: true })).toBeVisible();
});

test("brand logos come from one cached sprite and render", async ({ page, request }) => {
  await page.goto("/");
  const uses = page.locator(".logo use");
  // 25 logos are generated; the stack shows 23 (not GitHub or LinkedIn). Services (spec 5.3) reuse the same sprite.
  expect(await page.locator("#stack .logo use").count()).toBe(23);
  const hrefs = await uses.evaluateAll((els) => els.map((e) => e.getAttribute("href")));
  expect(hrefs.every((h) => /^\/logos\/sprite\.svg#logo-[a-z]+$/.test(h ?? "")), hrefs.join(",")).toBe(true);
  const sprite = await (await request.get("/logos/sprite.svg")).text();
  for (const id of new Set(hrefs.map((h) => h!.split("#")[1]))) expect(sprite, id).toContain(`id="${id}"`);
  await page.locator("#stack").scrollIntoViewIfNeeded();
  const terraform = page.locator('#stack .logo use[href$="#logo-terraform"]').first();
  await expect.poll(() => terraform.evaluate((el) => (el as SVGGraphicsElement).getBBox().width)).toBeGreaterThan(0);
  const html = await (await request.get("/")).text();
  expect(html).not.toContain("M10.204 14.35");
});

test.describe("one row per group (decision 2026-10-09)", () => {
  test.skip(({ isMobile }) => isMobile, "sets its own viewport widths");

  for (const width of [360, 768, 1024, 1440]) {
    test(`each group is its own row, label then logos, at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/");
      const groups = await page.locator("#stack [role=group]").evaluateAll((els) => els.map((g) => {
        const box = g.getBoundingClientRect();
        const label = g.querySelector("h3")!.getBoundingClientRect();
        const chips = g.querySelector(".stack-chips")!.getBoundingClientRect();
        return { top: box.top, bottom: box.bottom, width: box.width, labelRight: label.right, labelBottom: label.bottom, chipsLeft: chips.left, chipsTop: chips.top };
      }));
      expect(groups).toHaveLength(8);
      // Spec 5.2: the groups sit on the section's panel, so they span the panel's content box.
      const content = await page.locator("#stack .sky-panel").evaluate((el) => el.clientWidth - parseFloat(getComputedStyle(el).paddingLeft) - parseFloat(getComputedStyle(el).paddingRight));
      for (const [i, g] of groups.entries()) {
        expect(g.width, `group ${i} spans the content width`).toBeGreaterThanOrEqual(content - 1);
        if (i > 0) expect(g.top, `group ${i} starts below group ${i - 1}`).toBeGreaterThanOrEqual(groups[i - 1].bottom - 1);
        if (width >= 768) expect(g.chipsLeft, `group ${i}: logos sit right of the label`).toBeGreaterThan(g.labelRight);
        else expect(g.chipsTop, `group ${i}: logos sit below the label`).toBeGreaterThanOrEqual(g.labelBottom);
      }
    });
  }
});

test("chip icons share one 16px slot, centred on the label, with a visible (not hairline) stroke", async ({ page }) => {
  await page.goto("/");
  const chips = await page.locator("#stack .chip").evaluateAll((els) => els.map((el) => {
    const slot = el.querySelector<HTMLElement>(".chip-icon")!;
    const s = slot.getBoundingClientRect();
    const range = document.createRange();
    range.selectNodeContents(el.lastChild!);
    const t = range.getBoundingClientRect();
    const line = slot.querySelector(":scope > svg");
    return { name: el.textContent, w: s.width, h: s.height, offset: Math.abs((s.top + s.height / 2) - (t.top + t.height / 2)),
      stroke: line ? parseFloat(getComputedStyle(line).strokeWidth) * (s.width / 24) : null };
  }));
  for (const c of chips) {
    expect([c.w, c.h], c.name!).toEqual([16, 16]);
    expect(c.offset, `${c.name} icon centred on its label`).toBeLessThanOrEqual(1);
    if (c.stroke !== null) expect(c.stroke, `${c.name} stroke`).toBeGreaterThanOrEqual(1);
  }
});

test("section label icons are distinct, one per section", async ({ page }) => {
  await page.goto("/");
  const icons = await page.locator(".section-label svg").evaluateAll((els) => els.map((e) => e.innerHTML));
  expect(icons.length).toBeGreaterThanOrEqual(8);
  expect(new Set(icons).size).toBe(icons.length);
});
