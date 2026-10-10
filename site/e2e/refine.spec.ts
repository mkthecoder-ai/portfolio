import { test, expect, revealAll } from "./fixtures";

// Spec 5.3: the refinement round (About avatar, Services logos, certification badges, Play).

const box = (page: import("@playwright/test").Page, sel: string) => page.locator(sel).first().evaluate((el) => {
  const r = el.getBoundingClientRect();
  return { left: r.left, right: r.right, top: r.top + scrollY, bottom: r.bottom + scrollY, width: r.width, height: r.height, cx: r.left + r.width / 2, cy: r.top + scrollY + r.height / 2 };
});

test("About: the illustrated bust sits left of the text on desktop and above it on phones, sized up front (no layout shift)", async ({ page, isMobile }) => {
  await page.goto("/");
  await revealAll(page);
  const img = page.locator("#about .about-avatar img");
  await expect(page.locator('#about .about-avatar source[type="image/avif"]')).toHaveCount(1);
  expect(await img.getAttribute("width")).toBeTruthy();
  expect(await img.getAttribute("height")).toBeTruthy();
  expect(await img.getAttribute("alt")).toMatch(/Manoj/);
  await img.scrollIntoViewIfNeeded();
  await expect.poll(() => img.evaluate((i: HTMLImageElement) => i.complete && i.naturalWidth > 0)).toBe(true);
  const ratio = await img.evaluate((i: HTMLImageElement) => Math.abs(i.naturalWidth / i.naturalHeight - i.getBoundingClientRect().width / i.getBoundingClientRect().height));
  expect(ratio).toBeLessThan(0.01);
  const pic = await box(page, "#about .about-avatar"), text = await box(page, "#about .about-text");
  if (isMobile) expect(pic.bottom).toBeLessThanOrEqual(text.top + 1);
  else expect(pic.right).toBeLessThanOrEqual(text.left + 1);
  expect(await page.locator("#about .about-text p").count()).toBeGreaterThanOrEqual(2);
});

test("Services: six cards, each with official marks from the logo sprite, all the same size", async ({ page }) => {
  await page.goto("/");
  const cards = page.locator("#services .service");
  await expect(cards).toHaveCount(6);
  const sizes = await page.locator("#services .service-logo").evaluateAll((els) => els.map((e) => {
    const r = e.getBoundingClientRect();
    return { w: Math.round(r.width), h: Math.round(r.height), href: e.querySelector("use")?.getAttribute("href") ?? "" };
  }));
  expect(sizes.length).toBeGreaterThanOrEqual(6);
  for (const s of sizes) {
    expect(s.href).toMatch(/^\/logos\/sprite\.svg#logo-[a-z0-9]+$/);
    expect([s.w, s.h]).toEqual([sizes[0].w, sizes[0].h]);
  }
  for (let i = 0; i < 6; i++) expect(await cards.nth(i).locator(".service-logo").count(), `card ${i}`).toBeGreaterThan(0);
});

test("Certifications: large official badges (128px desktop, 96px phones), aspect kept, aligned with their text and Verify link", async ({ page, isMobile }) => {
  await page.goto("/");
  await revealAll(page);
  const badges = page.locator("#certifications img.cert-badge");
  await expect(badges).toHaveCount(3);
  for (let i = 0; i < 3; i++) {
    const b = badges.nth(i);
    await b.scrollIntoViewIfNeeded();
    await expect.poll(() => b.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
    const r = await b.evaluate((img: HTMLImageElement) => ({ w: img.getBoundingClientRect().width, h: img.getBoundingClientRect().height, nat: img.naturalWidth / img.naturalHeight }));
    expect(r.w).toBe(isMobile ? 96 : 128);
    expect(Math.abs(r.w / r.h - r.nat)).toBeLessThan(0.02);
    if (!isMobile) {
      const row = b.locator("xpath=..");
      const main = await row.locator(".cert-main").evaluate((e) => { const x = e.getBoundingClientRect(); return x.top + x.height / 2; });
      const verify = await row.locator(".cert-verify").evaluate((e) => { const x = e.getBoundingClientRect(); return x.top + x.height / 2; });
      const badge = await b.evaluate((e) => { const x = e.getBoundingClientRect(); return x.top + x.height / 2; });
      expect(Math.abs(main - badge), "text centred on the badge").toBeLessThan(4);
      expect(Math.abs(verify - badge), "Verify centred on the badge").toBeLessThan(4);
    }
  }
});

test("Play: left-aligned like every other section, the single card wide (spec 5.4)", async ({ page, isMobile }) => {
  await page.goto("/");
  const card = await box(page, "#play .play-item"), head = await box(page, "#play .section-head .label");
  expect(Math.abs(card.cx - card.width / 2 - (head.cx - head.width / 2))).toBeLessThan(1);
  expect(await page.locator("#play .section-head").evaluate((e) => getComputedStyle(e).textAlign)).not.toBe("center");
  if (!isMobile) expect(card.width).toBeGreaterThanOrEqual(600);
});

test("every section header starts on the panel's content edge: icon, label and heading left-aligned (spec 5.4)", async ({ page }) => {
  await page.goto("/");
  const rows = await page.locator("main > section:not(#home)").evaluateAll((sections) => sections.map((s) => {
    const panel = s.querySelector(".sky-panel")!, cs = getComputedStyle(panel);
    const edge = panel.getBoundingClientRect().left + parseFloat(cs.paddingLeft) + parseFloat(cs.borderLeftWidth);
    const h2 = s.querySelector("h2")!;
    return { id: s.id, edge, icon: s.querySelector(".section-label svg")!.getBoundingClientRect().left,
      h2: h2.classList.contains("sr-only") ? null : h2.getBoundingClientRect().left, align: getComputedStyle(s.querySelector(".section-head")!).textAlign };
  }));
  for (const r of rows) {
    expect(Math.abs(r.icon - r.edge), `${r.id} icon`).toBeLessThan(1);
    if (r.h2 !== null) expect(Math.abs(r.h2 - r.edge), `${r.id} heading`).toBeLessThan(4); // optical side bearing of the glyph
    expect(r.align, r.id).not.toBe("center");
  }
});

test("panels follow one vertical rhythm: 72-112px apart on desktop, 40-72px on phones (spec 5.4)", async ({ page, isMobile }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const gaps = await page.locator(".sky-panel").evaluateAll((els) => els.slice(1).map((el, i) => el.getBoundingClientRect().top - els[i].getBoundingClientRect().bottom));
  expect(gaps).toHaveLength(7); // eight panels: seven sections and the footer
  for (const g of gaps) {
    if (isMobile) { expect(g).toBeGreaterThanOrEqual(40); expect(g).toBeLessThanOrEqual(72); }
    else { expect(g).toBeGreaterThanOrEqual(72); expect(g).toBeLessThanOrEqual(112); }
  }
});

test("panels use the indigo surface tokens, not a flat black fill (spec 5.4)", async ({ page }) => {
  await page.goto("/");
  const bgs = await page.locator(".sky-panel").evaluateAll((els) => els.map((e) => getComputedStyle(e).backgroundImage));
  for (const bg of bgs) expect(bg).toMatch(/linear-gradient/);
  const cards = await page.locator(".sky-panel .card").evaluateAll((els) => els.map((e) => getComputedStyle(e).backgroundColor));
  for (const c of cards) expect(c).toMatch(/rgba\(.+, 0\.0\d+\)/); // translucent, never an opaque block
});
