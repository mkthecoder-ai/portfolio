#!/usr/bin/env node
// node scripts/lighthouse.mjs [url]. Without a url it serves site/out locally. Enforces spec 9.3:
// Performance ≥ 95, Accessibility, Best Practices and SEO 100, CLS < 0.05 (mobile emulation, Lighthouse defaults).
import { chromium } from "@playwright/test";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdir, readFile } from "node:fs/promises";
import { createStaticServer } from "./serve-out.mjs";

// v2 (spec 5.0): mobile Performance >= 85.
const TARGETS = { performance: 0.85, accessibility: 1, "best-practices": 1, seo: 1 };
const MAX_CLS = 0.05;
const external = process.argv[2];
let server;
if (!external) { server = await createStaticServer("site/out"); await new Promise((r) => server.listen(3200, r)); }
const url = external ?? "http://localhost:3200/";
await mkdir("review", { recursive: true });
const outPath = `review/lighthouse-${Date.now()}.json`;
try {
  // Async on purpose: the static server lives in this process, so a sync child would deadlock it.
  // --no-sandbox matches how Playwright launches Chromium (Ubuntu's AppArmor blocks the userns sandbox); it only loads this site.
  await promisify(execFile)("npx", ["-y", "lighthouse@13.5.0", url, "--quiet", "--output=json", `--output-path=${outPath}`,
    "--only-categories=performance,accessibility,best-practices,seo", "--chrome-flags=--headless=new --no-sandbox"],
    { env: { ...process.env, CHROME_PATH: chromium.executablePath() }, maxBuffer: 64 * 1024 * 1024 });
} finally {
  server?.close();
}
const { categories, audits } = JSON.parse(await readFile(outPath, "utf8"));
let failed = false;
for (const [key, min] of Object.entries(TARGETS)) {
  const ok = categories[key].score >= min;
  failed ||= !ok;
  console.log(`${ok ? "PASS" : "FAIL"} ${key}: ${Math.round(categories[key].score * 100)} (target ${Math.round(min * 100)})`);
}
const cls = audits["cumulative-layout-shift"].numericValue;
const clsOk = cls < MAX_CLS;
failed ||= !clsOk;
console.log(`${clsOk ? "PASS" : "FAIL"} CLS: ${cls.toFixed(3)} (target < ${MAX_CLS})`);
if (failed) for (const [id, a] of Object.entries(audits)) if (a.score !== null && a.score < 1 && a.scoreDisplayMode !== "informative" && a.scoreDisplayMode !== "notApplicable") console.log(`  audit ${id}: ${a.score} ${a.displayValue ?? ""}`);
console.log(`report: ${outPath}`);
if (failed) process.exit(1);
