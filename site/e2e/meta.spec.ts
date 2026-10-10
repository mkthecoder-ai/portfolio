import { test, expect } from "./fixtures";

test("has the agreed metadata and structured data", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle("Manoj Kumar | DevOps & Platform Engineer (Azure, Kubernetes, Terraform)");
  await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /since 2018/);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://mkthecoder.com/");
  const ld = JSON.parse((await page.locator('script[type="application/ld+json"]').textContent())!);
  expect(ld["@type"]).toBe("Person");
  expect(ld.sameAs).toEqual(["https://www.linkedin.com/in/mkthecoder", "https://github.com/mkthecoder-ai"]);
});

test("is served with the security headers", async ({ page }) => {
  const headers = (await page.goto("/"))!.headers();
  expect(headers["content-security-policy"]).toContain("default-src 'self'");
  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
});

test("loads Geist from the site itself", async ({ page }) => {
  const fontRequests: string[] = [];
  page.on("request", (r) => { if (r.resourceType() === "font") fontRequests.push(r.url()); });
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  expect(fontRequests.length).toBeGreaterThan(0);
  for (const url of fontRequests) expect(url).toMatch(/^http:\/\/localhost:3000\/_next\/static\/media\//);
  expect(await page.evaluate(() => getComputedStyle(document.body).fontFamily)).toMatch(/Geist/i);
});

test("has a skip link to the main content", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Skip to content" })).toBeFocused();
});

test("shows section labels in the agreed format", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#work .section-head .label")).toHaveText("01 / Work");
  await expect(page.locator("#contact .section-head .label")).toHaveText("07 / Contact");
});

test("only Geist Sans is preloaded; Geist Mono (labels and tags) still loads and applies", async ({ page }) => {
  await page.goto("/");
  const preloads = await page.locator('link[rel="preload"][as="font"]').evaluateAll((els) => els.map((e) => e.getAttribute("href")));
  expect(preloads).toHaveLength(1);
  expect(preloads[0]).toMatch(/Geist_Variable/);
  await page.evaluate(() => document.fonts.ready);
  const mono = await page.locator("#work .label").first().evaluate(async (el) => {
    const family = getComputedStyle(el).fontFamily.split(",")[0].trim();
    await document.fonts.load(`12px ${family}`);
    return { family, loaded: document.fonts.check(`12px ${family}`) && [...document.fonts].some((f) => f.family.replace(/['"]/g, "") === family.replace(/['"]/g, "") && f.status === "loaded") };
  });
  expect(mono.family).toMatch(/Geist ?Mono/i);
  expect(mono.loaded).toBe(true);
});
