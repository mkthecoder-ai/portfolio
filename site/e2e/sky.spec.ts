import { test, expect } from "./fixtures";

// Spec 5.2: the living background behind every section, and the header that floats over it.
// window.__sky is declared in src/components/sky/engine.ts.


test("every part of the page belongs to one of the six stages, in order", async ({ page }) => {
  await page.goto("/");
  const stages = await page.locator("[data-stage]").evaluateAll((els) => els.map((e) => `${e.id || e.tagName.toLowerCase()}:${(e as HTMLElement).dataset.stage}`));
  expect(stages).toEqual(["home:1", "work:2", "about:3", "play:3", "services:4", "stack:4", "experience:5", "certifications:5", "contact:6", "footer:6"]);
});

test("without the live sky, each stage has its own painted gradient (no plain black)", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const backgrounds = await page.locator("main > section:not(#home), footer").evaluateAll((els) => els.map((e) => getComputedStyle(e).backgroundImage));
  for (const bg of backgrounds) expect(bg).toContain("gradient");
});

test.describe("live sky", () => {
  test("loads after first paint, outside the initial bundle, and follows the scroll through the stages", async ({ page, request }) => {
    // Hold back every script that the page's HTML does not reference. If the engine were in the initial bundle,
    // the sky would be ready long before the held scripts arrive.
    const html = await (await request.get("/")).text();
    const initial = [...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map((m) => m[1]);
    const HOLD = 2500;
    await page.route(/\.js$/, async (route) => {
      if (!initial.some((src) => route.request().url().endsWith(src))) await new Promise((r) => setTimeout(r, HOLD));
      await route.continue();
    });
    const t0 = Date.now();
    await page.goto("/");
    await page.waitForFunction(() => window.__sky?.ready, null, { timeout: 15000 });
    expect(Date.now() - t0, "the sky engine arrives as its own lazy chunk").toBeGreaterThanOrEqual(HOLD);
    await expect(page.locator("html")).toHaveAttribute("data-sky", "live");

    for (const [id, stage] of [["work", 2], ["about", 3], ["services", 4], ["experience", 5], ["contact", 6]] as const) {
      await page.evaluate((i) => document.getElementById(i)!.scrollIntoView({ block: "start", behavior: "instant" }), id);
      await expect.poll(() => page.evaluate(() => Math.round(window.__sky!.stage)), { message: id }).toBe(stage);
    }
  });

  test("never draws faster than 60 frames a second and stops while the tab is hidden", async ({ page }) => {
    await page.goto("/");
    await page.waitForFunction(() => window.__sky?.ready);
    await page.evaluate(() => document.getElementById("about")!.scrollIntoView({ behavior: "instant" }));
    // Count frames over two seconds, timed inside the page.
    const perSecond = await page.evaluate(() => new Promise<number>((resolve) => {
      const f0 = window.__sky!.frames, t0 = performance.now();
      setTimeout(() => resolve(((window.__sky!.frames - f0) * 1000) / (performance.now() - t0)), 2000);
    }));
    expect(perSecond).toBeGreaterThan(5);
    expect(perSecond).toBeLessThanOrEqual(62);

    await page.evaluate(() => {
      Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "hidden" });
      document.dispatchEvent(new Event("visibilitychange"));
    });
    await page.waitForTimeout(100);
    const h0 = await page.evaluate(() => window.__sky!.frames);
    await page.waitForTimeout(600);
    expect(await page.evaluate(() => window.__sky!.frames)).toBe(h0);
  });

  test("phones get the light version: no painted silhouettes are downloaded", async ({ page, isMobile }) => {
    test.skip(!isMobile, "phones only");
    const silhouettes: string[] = [];
    page.on("request", (r) => { if (r.url().includes("/sky/")) silhouettes.push(r.url()); });
    await page.goto("/");
    await page.waitForFunction(() => window.__sky?.ready);
    expect(await page.evaluate(() => window.__sky!.mode)).toBe("phone");
    await page.evaluate(() => document.getElementById("contact")!.scrollIntoView({ behavior: "instant" }));
    await page.waitForTimeout(500);
    expect(silhouettes).toEqual([]);
  });

  test("turbine rotors: three blades joined at one hub, turning as one rigid body", async ({ page, isMobile }) => {
    test.skip(isMobile, "desktop only (phones get no painted turbines)");
    await page.goto("/");
    await page.waitForFunction(() => window.__sky?.ready);
    await page.evaluate(() => document.getElementById("work")!.scrollIntoView({ block: "start", behavior: "instant" }));
    await page.waitForFunction(() => Math.round(window.__sky!.stage) === 2 && window.__sky!.rotors.length === 7, null, { timeout: 15000 });
    await page.waitForTimeout(1200);
    // Reads the canvas and the rotor poses of the same drawn frame (both are synchronous, between frames).
    const sample = () => page.evaluate(() => {
      const c = document.querySelector<HTMLCanvasElement>(".sky-canvas")!;
      const g = c.getContext("2d")!;
      const k = c.width / c.clientWidth;
      const FILL = [196, 184, 224]; // #c4b8e0, the blade colour in the night stages
      const like = (x: number, y: number) => {
        const [r, gr, b] = g.getImageData(Math.round(x * k), Math.round(y * k), 1, 1).data;
        return Math.hypot(r - FILL[0], gr - FILL[1], b - FILL[2]) < 45;
      };
      const out = { blade: 0, bladeMiss: [] as string[], hub: 0, hubMiss: [] as string[], gap: 0, gapHit: 0, angles: [] as number[] };
      window.__sky!.rotors.forEach((r, i) => {
        if (r.x - r.L < 0 || r.x + r.L > c.clientWidth || r.y - r.L < 70 || r.y + r.L > c.clientHeight) return; // off screen or under the header
        out.angles.push(r.angle);
        for (let b = 0; b < 3; b++) {
          const a = r.angle - Math.PI / 2 + (b * 2 * Math.PI) / 3;
          // On the chord's centre line (the trailing side is wider: src/lib/rotor.ts), where the blade is 6-8% of L
          // wide, so a sample never lands on the anti-aliased edge of the ink outline.
          for (const [f, off] of [[0.12, 0.005], [0.25, 0.01], [0.4, 0.007]]) {
            out.blade++;
            const x = r.x + (Math.cos(a) * f + Math.sin(a) * off) * r.L, y = r.y + (Math.sin(a) * f - Math.cos(a) * off) * r.L;
            if (!like(x, y)) out.bladeMiss.push(`rotor ${i} blade ${b} at ${f}`);
          }
          // Halfway between two blades: sky, not blade (so there are exactly three).
          const m = a + Math.PI / 3;
          out.gap++;
          if (like(r.x + Math.cos(m) * 0.6 * r.L, r.y + Math.sin(m) * 0.6 * r.L)) out.gapHit++;
          // Inside the hub between the blade roots: filled, so the roots are joined. Sampled midway between the
          // spinner ring (0.0375 L) and the hub edge (0.075 L), on rotors big enough to clear the strokes' edges.
          if (r.L >= 110) {
            out.hub++;
            if (!like(r.x + Math.cos(m) * 0.056 * r.L, r.y + Math.sin(m) * 0.056 * r.L)) out.hubMiss.push(`rotor ${i} hub after blade ${b}`);
          }
        }
      });
      return out;
    });
    // The rising data packets are drawn over the turbines at random places, so one may sit on a sample point in a
    // frame: allow one transient miss per frame. A real defect (blade off the hub, hub too small) misses on every
    // rotor in every frame, and a rotor missing in two frames fails.
    const seen: number[][] = [];
    const missedBy = new Map<string, number>();
    for (let n = 0; n < 3; n++) {
      const s = await sample();
      expect(s.blade, "at least two rotors fully on screen").toBeGreaterThanOrEqual(18);
      const misses = [...s.bladeMiss, ...s.hubMiss];
      expect(misses.length, `every blade is solid from the hub, and the hub joins the roots: ${misses.join(", ")}`).toBeLessThanOrEqual(1);
      for (const m of misses) { const rotor = m.split(" ").slice(0, 2).join(" "); missedBy.set(rotor, (missedBy.get(rotor) ?? 0) + 1); }
      expect(s.gapHit / s.gap, "nothing but sky between the blades").toBeLessThan(0.1);
      seen.push(s.angles);
      await page.waitForTimeout(350);
    }
    for (const [rotor, n] of missedBy) expect(n, `${rotor} misses in more than one frame`).toBeLessThan(2);
    // The rotors really turn between samples (the checks above held at three different angles).
    expect(Math.abs(seen[2][0] - seen[0][0])).toBeGreaterThan(0.3);
  });

  test("desktops get the full version with the painted silhouettes", async ({ page, isMobile }) => {
    test.skip(isMobile, "desktop only");
    await page.goto("/");
    await page.waitForFunction(() => window.__sky?.ready);
    expect(await page.evaluate(() => window.__sky!.mode)).toBe("full");
  });
});

test("reduced motion: no animated sky at all", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.waitForTimeout(2500);
  expect(await page.evaluate(() => window.__sky)).toBeUndefined();
  await expect(page.locator("html")).not.toHaveAttribute("data-sky", /.*/);
});

test("the header name is large and confident, with the mkthecoder handle beside it", async ({ page, isMobile }) => {
  await page.goto("/");
  const name = page.locator(".site-header .brand-name");
  const size = await name.evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
  if (isMobile) expect(size).toBe(18); else { expect(size).toBeGreaterThanOrEqual(20); expect(size).toBeLessThanOrEqual(22); }
  expect(await name.evaluate((el) => getComputedStyle(el).fontWeight)).toBe("600");
  const handle = page.locator(".site-header .brand-handle");
  await expect(handle).toHaveText("mkthecoder");
  expect(await handle.evaluate((el) => getComputedStyle(el).fontFamily)).toMatch(/mono/i);
  // The header still shrinks on scroll.
  const tall = await page.locator(".header-inner").evaluate((el) => el.getBoundingClientRect().height);
  await page.evaluate(() => document.getElementById("about")!.scrollIntoView({ behavior: "instant" }));
  await expect.poll(() => page.locator(".header-inner").evaluate((el) => el.getBoundingClientRect().height)).toBeLessThan(tall);
});
