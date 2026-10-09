#!/usr/bin/env node
// Internal anchors must resolve and site files must exist. External links must answer < 400,
// except hosts that block bots (warnings or skipped, see severityFor). --offline skips external links.
//   node scripts/check-links.mjs site/out/index.html      a local build (site files checked on disk)
//   node scripts/check-links.mjs --url https://mkthecoder.com/   the live site (site files checked over HTTP)
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { extractLinks, probe, severityFor } from "./links.mjs";

const args = process.argv.slice(2);
const urlAt = args.indexOf("--url");
const liveUrl = urlAt >= 0 ? args[urlAt + 1] : null;
const page = liveUrl ? null : (args.find((a) => !a.startsWith("--")) ?? "site/out/index.html");

let html;
if (liveUrl) {
  const res = await fetch(liveUrl, { redirect: "follow" });
  if (!res.ok) { console.error(`HTTP ${res.status}: ${liveUrl}`); process.exit(1); }
  html = await res.text();
} else {
  html = await readFile(page, "utf8");
}
const { anchors, ids, external, files } = extractLinks(html);
let failures = 0;
let warnings = 0;
for (const a of anchors) if (!ids.includes(a)) { console.error(`broken anchor: #${a}`); failures++; }
for (const f of files) {
  const found = liveUrl
    ? (await probe(new URL(f, liveUrl).href)) === ""
    : existsSync(join(dirname(page), decodeURIComponent(f))) || existsSync(join(dirname(page), decodeURIComponent(f), "index.html"));
  if (!found) { console.error(`missing file: ${f}`); failures++; }
}
if (!args.includes("--offline")) {
  for (const url of external) {
    const severity = severityFor(url);
    if (severity === "skip") { console.log(`skipped (blocks bots): ${url}`); continue; }
    const problem = await probe(url);
    if (!problem) continue;
    if (severity === "warn") { console.warn(`warning: ${problem}: ${url}`); warnings++; } else { console.error(`${problem}: ${url}`); failures++; }
  }
}
if (failures) process.exit(1);
console.log(`check-links: OK (${anchors.length} anchors, ${files.length} files, ${external.length} external, ${warnings} warning(s))`);
