import { test, expect, revealAll } from "./fixtures";
import { stagePositions, textContrastFailures } from "./contrast";

// Spec 5.2: AA for every line of text at every stage of the living background, over the live canvas (desktop
// and phone versions) and over the static painted gradients (reduced motion, and before the sky has loaded).

async function walkAllStages(page: import("@playwright/test").Page, label: string) {
  await revealAll(page);
  const failures: string[] = [];
  // The header over the hero at the top of the page.
  failures.push(...(await textContrastFailures(page, `${label} top`)));
  for (const stage of [2, 3, 4, 5, 6]) {
    for (const y of await stagePositions(page, stage)) {
      await page.evaluate((top) => window.scrollTo({ top, behavior: "instant" }), y);
      await page.waitForTimeout(450);
      failures.push(...(await textContrastFailures(page, `${label} stage ${stage} y=${y}`)));
    }
  }
  expect(failures, failures.join("\n")).toEqual([]);
}

test.describe("AA at every stage", () => {
  test.setTimeout(180_000);

  test("over the live sky", async ({ page, isMobile }) => {
    await page.goto("/");
    await page.waitForFunction(() => window.__sky?.ready);
    if (!isMobile) await page.waitForFunction(() => [...document.querySelectorAll(".painted img")].every((i) => (i as HTMLImageElement).complete));
    await page.waitForTimeout(1500); // the silhouettes decode
    await walkAllStages(page, isMobile ? "phone live" : "desktop live");
  });

  test("over the static painted gradients (reduced motion)", async ({ page, isMobile }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await walkAllStages(page, isMobile ? "phone static" : "desktop static");
  });
});
