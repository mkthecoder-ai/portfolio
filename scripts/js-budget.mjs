#!/usr/bin/env node
// Home-page first-load JS = gzip size of every distinct <script src> on index.html (nomodule polyfills excluded).
//   node scripts/js-budget.mjs site/out            check against site/perf-budget.json
//   node scripts/js-budget.mjs site/out --measure  record the baseline and set budget = baseline + 25 kB
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { gzipSync } from "node:zlib";
import { pathToFileURL } from "node:url";

export async function firstLoadJsBytes(outDir) {
  const html = await readFile(join(outDir, "index.html"), "utf8");
  // nomodule scripts (legacy polyfills) are never downloaded by browsers that support modules.
  const tags = [...html.matchAll(/<script\b([^>]*)>/g)].map((m) => m[1]).filter((attrs) => !/\snomodule\b/i.test(attrs));
  const srcs = [...new Set(tags.map((attrs) => attrs.match(/\ssrc="([^"]+)"/)?.[1]).filter(Boolean))];
  let total = 0;
  for (const src of srcs) total += gzipSync(await readFile(join(outDir, decodeURIComponent(src.split("?")[0])))).length;
  return { total, files: srcs.length };
}

const kb = (bytes) => Math.round((bytes / 1024) * 10) / 10;

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const outDir = process.argv[2] ?? "site/out";
  const budgetFile = "site/perf-budget.json";
  const { total, files } = await firstLoadJsBytes(outDir);
  if (process.argv.includes("--measure")) {
    const baselineKb = kb(total);
    const budget = {
      baselineKb,
      budgetKb: Math.round((baselineKb + 25) * 10) / 10,
      method: "gzip of every distinct <script src> on index.html, excluding nomodule polyfills; baseline = a page with no client components",
      measuredOn: new Date().toISOString().slice(0, 10),
    };
    await writeFile(budgetFile, `${JSON.stringify(budget, null, 2)}\n`);
    console.log(`js-budget: baseline ${baselineKb} kB gzipped (${files} files); budget set to ${budget.budgetKb} kB`);
  } else {
    const { budgetKb } = JSON.parse(await readFile(budgetFile, "utf8"));
    if (kb(total) > budgetKb) { console.error(`js-budget: ${kb(total)} kB exceeds the budget of ${budgetKb} kB`); process.exit(1); }
    console.log(`js-budget: ${kb(total)} kB gzipped (budget ${budgetKb} kB, ${files} files)`);
  }
}
