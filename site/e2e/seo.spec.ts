import { test, expect } from "./fixtures";

test("robots.txt and sitemap.xml", async ({ request }) => {
  const robots = await (await request.get("/robots.txt")).text();
  expect(robots).toContain("Allow: /");
  expect(robots).toContain("Sitemap: https://mkthecoder.com/sitemap.xml");
  const sitemap = await (await request.get("/sitemap.xml")).text();
  expect(sitemap).toContain("<loc>https://mkthecoder.com/</loc>");
  expect(sitemap).not.toContain("/work/");
});

test("the OG image is a 1200×630 PNG", async ({ request }) => {
  const res = await request.get("/og.png");
  expect(res.headers()["content-type"]).toContain("image/png");
  const png = await res.body();
  expect(png.readUInt32BE(16)).toBe(1200);
  expect(png.readUInt32BE(20)).toBe(630);
});

test("the favicon set and the apple touch icon are linked and served", async ({ page, request }) => {
  await page.goto("/");
  for (const sel of ['link[rel="icon"][href^="/favicon.svg"]', 'link[rel="icon"][href^="/favicon.ico"]', 'link[rel="apple-touch-icon"][href^="/apple-touch-icon.png"]']) {
    const href = await page.locator(sel).getAttribute("href");
    expect(href, sel).toBeTruthy();
    expect((await request.get(href!)).ok(), href!).toBe(true);
  }
});

test("favicon.ico holds 16, 32 and 48px images", async ({ request }) => {
  const ico = await (await request.get("/favicon.ico")).body();
  const count = ico.readUInt16LE(4);
  expect([...Array(count)].map((_, i) => ico.readUInt8(6 + i * 16))).toEqual([16, 32, 48]);
});

test("the web app manifest is linked and lists the 192 and 512px icons, all served", async ({ page, request }) => {
  await page.goto("/");
  const href = await page.locator('link[rel="manifest"]').getAttribute("href");
  expect(href).toBeTruthy();
  const manifest = await (await request.get(href!)).json();
  expect(manifest.name).toBe("Manoj Kumar");
  const icons = manifest.icons as { src: string; sizes: string; type: string }[];
  expect(icons.map((i) => i.sizes)).toEqual(["192x192", "512x512"]);
  for (const icon of icons) {
    const res = await request.get(icon.src);
    expect(res.ok(), icon.src).toBe(true);
    const png = await res.body();
    expect(`${png.readUInt32BE(16)}x${png.readUInt32BE(20)}`).toBe(icon.sizes);
  }
});

test.describe("404", () => {
  test.use({ allowHttpErrors: true });
  test("unknown paths get the designed 404 with a way home, kept out of search", async ({ page }) => {
    const response = await page.goto("/no-such-page");
    expect(response!.status()).toBe(404);
    await expect(page.locator(".label").first()).toHaveText("404 / Not found");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("This page doesn't exist.");
    await expect(page.getByRole("link", { name: "Back to mkthecoder.com" })).toHaveAttribute("href", "/");
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  });
});

test.describe("404 navigation", () => {
  test.use({ allowHttpErrors: true });
  test("the way home works from the 404", async ({ page }) => {
    await page.goto("/no-such-page");
    await page.getByRole("link", { name: "Back to mkthecoder.com" }).click();
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Manoj Kumar");
  });
});
