#!/usr/bin/env node
// Usage: node scripts/check-content.mjs site/out [--launch]
import { readdir, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { checkHtml, launchProblems } from "./content-rules.mjs";

const outDir = process.argv[2] ?? "site/out";
const launch = process.argv.includes("--launch");
const entries = await readdir(outDir, { withFileTypes: true, recursive: true });
const htmlFiles = entries.filter((e) => e.isFile() && e.name.endsWith(".html")).map((e) => join(e.parentPath, e.name));

let failures = 0;
for (const file of htmlFiles) {
  const html = await readFile(file, "utf8");
  for (const p of checkHtml(html)) { console.error(`${file}: [${p.rule}] ${p.match}`); failures++; }
  if (launch && file === join(outDir, "index.html")) {
    for (const p of launchProblems(html, (f) => existsSync(join(outDir, f)))) { console.error(`${file}: [launch] ${p}`); failures++; }
  }
}
if (failures) { console.error(`check-content: ${failures} problem(s)`); process.exit(1); }
console.log(`check-content: OK${launch ? " (launch mode)" : ""}`);
