import { test as base, expect, type Page } from "@playwright/test";

/**
 * Every test fails on console errors, page errors, failed or third-party requests, or HTTP errors.
 * allowHttpErrors accepts only the error status of the page itself (the 404 test) and Chromium's matching
 * "Failed to load resource" console line; an error on any sub-resource still fails.
 */
export const test = base.extend<{ allowHttpErrors: boolean; guard: void }>({
  allowHttpErrors: [false, { option: true }],
  guard: [async ({ page, baseURL, allowHttpErrors, javaScriptEnabled }, use) => {
    const problems: string[] = [];
    const consoleErrors: { text: string; url: string }[] = [];
    const errorDocuments = new Set<string>();
    const origin = new URL(baseURL!).origin;
    page.on("console", (m) => { if (m.type() === "error") consoleErrors.push({ text: m.text(), url: m.location().url }); });
    page.on("pageerror", (e) => problems.push(`pageerror: ${e.message}`));
    page.on("requestfailed", (r) => {
      // With JavaScript disabled, Chromium refuses script downloads itself (reported as "csp"); that is the
      // browser setting, not a site failure. Any other failed request still fails the test.
      if (javaScriptEnabled === false && r.resourceType() === "script" && r.failure()?.errorText === "csp") return;
      problems.push(`requestfailed: ${r.url()} ${r.failure()?.errorText ?? ""}`);
    });
    page.on("request", (r) => {
      const u = r.url();
      if (!u.startsWith(origin) && !u.startsWith("data:") && !u.startsWith("blob:")) problems.push(`third-party request: ${u}`);
    });
    page.on("response", (r) => {
      if (r.status() < 400 || !r.url().startsWith(origin)) return;
      if (allowHttpErrors && r.request().isNavigationRequest() && r.frame() === page.mainFrame()) { errorDocuments.add(r.url()); return; }
      problems.push(`HTTP ${r.status()}: ${r.url()}`);
    });
    await use();
    for (const e of consoleErrors) {
      if (errorDocuments.has(e.url) && /^Failed to load resource: the server responded with a status of 4\d\d/.test(e.text)) continue;
      problems.push(`console: ${e.text}`);
    }
    expect(problems, problems.join("\n")).toEqual([]);
  }, { auto: true }],
});

export { expect };

/** Shows every .reveal element immediately (screenshots, contrast checks). */
export async function revealAll(page: Page) {
  await page.evaluate(() => document.querySelectorAll(".reveal").forEach((el) => el.classList.add("is-in")));
  await page.waitForTimeout(700);
}
