import { test, expect } from "./fixtures";

const planeY = (page: import("@playwright/test").Page, id: string) =>
  page.locator(`.plane[data-plane="${id}"]`).evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).m42);

test("the hero is real HTML: name, role, headline, subline, two CTAs and the cert badges; no photo", async ({ page }) => {
  await page.goto("/");
  const hero = page.locator("#home");
  const h1 = page.getByRole("heading", { level: 1 });
  // Spec 5.3: the name is the H1, the designation directly below it, then the tagline.
  await expect(h1).toHaveText("Manoj Kumar");
  await expect(hero.locator("h1 + .dusk-role")).toHaveText("DevOps & Platform Engineer");
  await expect(hero.locator(".dusk-role + .dusk-tagline .dusk-line")).toHaveText(["I take reliability seriously.", "Production should be boring."]);
  await expect(hero.getByText("Azure platforms with the guardrails built in.", { exact: true })).toBeVisible();
  await expect(hero.getByRole("link", { name: "View work" })).toHaveAttribute("href", "#work");
  await expect(hero.getByRole("link", { name: "Email me" })).toHaveAttribute("href", "mailto:manojkumarm0107@gmail.com");
  await expect(hero.getByRole("list", { name: "Certifications" }).getByRole("listitem")).toHaveText(["AZ-104", "Terraform Associate", "AZ-900"]);
  await expect(hero).not.toContainText(/open to|available|availability|photo|headshot|avatar/i);
  // No photo (spec 3.2): the only image is the decorative static composition of the scene (spec 5.0).
  const imgs = await hero.locator("img").evaluateAll((els) => els.map((e) => ({ src: e.getAttribute("src"), alt: e.getAttribute("alt") })));
  // Spec 5.1: the painted scene layers (/hero/art/) and the static composition (/hero/) are decorative; nothing else.
  for (const img of imgs) {
    expect(img.alt, img.src ?? "").toBe("");
    expect(img.src).toMatch(/^\/hero\/(dusk-4x5\.webp|art\/(sky|far-hills|shore|lake|ridge)-\d+\.webp)$/);
  }
  expect(await hero.getByRole("link", { name: "View work" }).evaluate((el) => getComputedStyle(el).backgroundColor)).toBe("rgb(34, 211, 238)");
});

test("the name and the tagline never break inside a word (spec 5.6)", async ({ page }) => {
  await page.goto("/");
  const broken = await page.locator("#home").evaluate((hero) => {
    const out: string[] = [];
    for (const el of hero.querySelectorAll("h1, .dusk-line")) {
      const text = el.firstChild as Text;
      for (const m of text.textContent!.matchAll(/[^\s\u00a0]+/g)) {
        const r = document.createRange();
        r.setStart(text, m.index!); r.setEnd(text, m.index! + m[0].length);
        const tops = new Set([...r.getClientRects()].map((b) => Math.round(b.top)));
        if (tops.size > 1) out.push(m[0]);
      }
    }
    return out;
  });
  expect(broken).toEqual([]);
});

test("hero hierarchy: the name is the largest text (56-88px), the designation 20-24px, then tagline, CTAs, chips", async ({ page }) => {
  await page.goto("/");
  const sizes = await page.locator("#home").evaluate((hero) => {
    const px = (sel: string) => parseFloat(getComputedStyle(hero.querySelector(sel)!).fontSize);
    const all = [...hero.querySelectorAll<HTMLElement>(".dusk-panel *")].filter((e) => e.childNodes.length && [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent!.trim()));
    const top = (sel: string) => hero.querySelector(sel)!.getBoundingClientRect().top;
    return { h1: px("h1"), role: px(".dusk-role"), max: Math.max(...all.map((e) => parseFloat(getComputedStyle(e).fontSize))),
      order: [top("h1"), top(".dusk-role"), top(".dusk-tagline"), top(".hero-ctas"), top(".hero-badges")] };
  });
  expect(sizes.h1).toBeGreaterThanOrEqual(56);
  expect(sizes.h1).toBeLessThanOrEqual(88);
  expect(sizes.h1).toBe(sizes.max);
  expect(sizes.role).toBeGreaterThanOrEqual(20);
  expect(sizes.role).toBeLessThanOrEqual(24);
  expect([...sizes.order].sort((a, b) => a - b)).toEqual(sizes.order);
});

test.describe("live tier (wide screens with motion)", () => {
  test.skip(({ isMobile }) => isMobile, "desktop only");

  test("shows the layered scene, not the static image, over a 240svh scroll track", async ({ page }) => {
    await page.goto("/");
    await page.waitForFunction(() => window.__dusk?.ready === true);
    expect(await page.evaluate(() => document.documentElement.dataset.hero)).toBe("live");
    await expect(page.locator(".dusk-scene")).toBeVisible();
    await expect(page.locator(".plane")).toHaveCount(5);
    expect(await page.locator(".dusk-static img").evaluate((img: HTMLImageElement) => img.currentSrc)).toMatch(/^data:image\/gif/);
    const ratio = await page.evaluate(() => document.getElementById("home")!.offsetHeight / window.innerHeight);
    expect(ratio).toBeGreaterThan(2.3);
  });

  test("planes rise at their parallax factors as the camera descends; the ridge, rider and bike move as one (spec 5.1)", async ({ page }) => {
    await page.goto("/");
    await page.waitForFunction(() => window.__dusk?.ready === true);
    const track = await page.evaluate(() => document.getElementById("home")!.offsetHeight - window.innerHeight);
    await page.evaluate((y) => window.scrollTo(0, y), track / 2);
    await page.waitForTimeout(400);
    const vh = await page.evaluate(() => window.innerHeight);
    const expected = (f: number) => -0.5 * 1.1 * vh * f;
    for (const [id, f] of [["sky", 0.04], ["far-hills", 0.18], ["shore", 0.28], ["lake", 0.28], ["ridge", 1.35]] as const) {
      // Within 3%: Lenis may still be settling the last few pixels of the scroll.
      expect(Math.abs((await planeY(page, id)) - expected(f)), id).toBeLessThan(Math.max(6, Math.abs(expected(f)) * 0.03));
    }
  });

  test("each hero rotor is one outline (three blades and the hub) spinning about its hub, undistorted", async ({ page }) => {
    await page.goto("/");
    await page.waitForFunction(() => window.__dusk?.ready === true);
    const rotors = await page.locator(".rotors").evaluate((svg: SVGSVGElement) => {
      const vb = svg.viewBox.baseVal, box = svg.getBoundingClientRect();
      return {
        // preserveAspectRatio="none": the box must keep the viewBox's aspect, or rotation would stretch the blades.
        skew: (box.width / box.height) / (vb.width / vb.height),
        rotors: [...svg.querySelectorAll<SVGGElement>(".rotor")].map((g) => {
          const path = g.querySelector("path")!, ring = g.querySelector("circle")!;
          const [ox, oy] = getComputedStyle(g).transformOrigin.split(" ").map(parseFloat);
          return { subpaths: (path.getAttribute("d")!.match(/M/g) ?? []).length, closed: /Z$/.test(path.getAttribute("d")!), ox, oy, cx: ring.cx.baseVal.value, cy: ring.cy.baseVal.value };
        }),
      };
    });
    expect(rotors.skew).toBeCloseTo(1, 2);
    expect(rotors.rotors).toHaveLength(6);
    for (const r of rotors.rotors) {
      expect(r.subpaths, "blades and hub are one outline").toBe(1);
      expect(r.closed).toBe(true);
      // The pivot is the hub centre (transform-origin is in viewBox units here, transform-box: view-box).
      expect(r.ox).toBeCloseTo(r.cx, 0);
      expect(r.oy).toBeCloseTo(r.cy, 0);
    }
  });

  test("the turbines spin faster as you scroll", async ({ page }) => {
    await page.goto("/");
    await page.waitForFunction(() => window.__dusk?.ready === true);
    const spin = async () => {
      const angle = () => page.locator(".rotor").first().evaluate((el) => new DOMMatrix(getComputedStyle(el).transform));
      const a = await angle(); await page.waitForTimeout(500); const b = await angle();
      const deg = (m: DOMMatrix) => (Math.atan2(m.b, m.a) * 180) / Math.PI;
      return ((deg(b) - deg(a)) + 360) % 360;
    };
    const slow = await spin();
    const track = await page.evaluate(() => document.getElementById("home")!.offsetHeight - window.innerHeight);
    await page.evaluate((y) => window.scrollTo(0, y), track * 0.6);
    await page.waitForTimeout(300);
    const fast = await spin();
    expect(fast).toBeGreaterThan(slow * 2);
  });

  test("the motion loop stops once the hero has scrolled away", async ({ page }) => {
    await page.goto("/");
    await page.waitForFunction(() => window.__dusk?.ready === true);
    await page.locator("#services").scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    const a = await page.evaluate(() => window.__dusk!.frames);
    await page.waitForTimeout(600);
    expect(await page.evaluate(() => window.__dusk!.frames)).toBe(a);
  });

  test("loading and scrolling the hero shifts no layout (CLS)", async ({ page }) => {
    await page.addInitScript(() => {
      (window as unknown as { __cls: number }).__cls = 0;
      new PerformanceObserver((l) => { for (const e of l.getEntries() as unknown as { value: number; hadRecentInput: boolean }[]) if (!e.hadRecentInput) (window as unknown as { __cls: number }).__cls += e.value; }).observe({ type: "layout-shift", buffered: true });
    });
    await page.goto("/");
    await page.waitForFunction(() => window.__dusk?.ready === true);
    for (let y = 0; y < 2000; y += 250) { await page.evaluate((y) => window.scrollTo(0, y), y); await page.waitForTimeout(80); }
    expect(await page.evaluate(() => (window as unknown as { __cls: number }).__cls)).toBeLessThan(0.05);
  });
});

test.describe("static tier", () => {
  test("phones get one static composed image and no scroll track", async ({ page, isMobile }) => {
    test.skip(!isMobile, "mobile");
    await page.goto("/");
    expect(await page.evaluate(() => document.documentElement.dataset.hero)).toBeUndefined();
    await expect(page.locator(".dusk-scene")).toBeHidden();
    const img = page.locator(".dusk-static img");
    await expect.poll(() => img.evaluate((i: HTMLImageElement) => i.complete && i.naturalWidth > 0 && i.currentSrc)).toMatch(/dusk-4x5\.webp$/);
    const ratio = await page.evaluate(() => document.getElementById("home")!.offsetHeight / window.innerHeight);
    expect(ratio).toBeLessThan(1.05);
  });

  test("reduced motion gets the static image on a wide screen too", async ({ browser, isMobile }) => {
    test.skip(isMobile, "desktop");
    const ctx = await browser.newContext({ reducedMotion: "reduce", viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await page.addInitScript(() => sessionStorage.setItem("opened", "1"));
    await page.goto(test.info().project.use.baseURL + "/");
    expect(await page.evaluate(() => document.documentElement.dataset.hero)).toBeUndefined();
    await expect.poll(() => page.locator(".dusk-static img").evaluate((i: HTMLImageElement) => i.currentSrc)).toMatch(/dusk-16x10\.webp$/);
    await ctx.close();
  });
});

test.describe("layout", () => {
  test.skip(({ isMobile }) => isMobile, "sets its own viewport widths");
  for (const width of [360, 768, 1024, 1440]) {
    test(`no horizontal overflow at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/");
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    });
  }
});
