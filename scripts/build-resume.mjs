#!/usr/bin/env node
// Builds resume/Manoj_Kumar_Resume.pdf and the site's copy, site/public/Manoj_Kumar_M_Resume.pdf (A4, at most two pages, blocks never split
// across pages), from resume/resume.html with Geist embedded, so the PDF
// looks the same everywhere and its text stays selectable for applicant tracking systems.
// Fails if the résumé runs past two pages or contains anything that looks like a phone number (this
// repository is public).
import { chromium } from "playwright";
import { readFile, writeFile } from "node:fs/promises";

const OUT = ["resume/Manoj_Kumar_Resume.pdf", "site/public/Manoj_Kumar_M_Resume.pdf"];
const font = async (family, weight, file) =>
  `@font-face { font-family: "${family}"; font-weight: ${weight}; src: url(data:font/woff2;base64,${(await readFile(file)).toString("base64")}) format("woff2"); }`;
const sans = "node_modules/geist/dist/fonts/geist-sans/";
const mono = "node_modules/geist/dist/fonts/geist-mono/";
const faces = (await Promise.all([
  font("Geist", 400, `${sans}Geist-Regular.woff2`), font("Geist", 500, `${sans}Geist-Medium.woff2`),
  font("Geist", 600, `${sans}Geist-SemiBold.woff2`), font("Geist", 700, `${sans}Geist-Bold.woff2`),
  font("Geist Mono", 400, `${mono}GeistMono-Regular.woff2`), font("Geist Mono", 500, `${mono}GeistMono-Medium.woff2`),
])).join("\n");

const html = (await readFile("resume/resume.html", "utf8")).replace("/*FONTS*/", faces);
if (/(\+91[\s-]?)?\b[6-9]\d{4}[\s-]?\d{5}\b/.test(html.replace(/<[^>]+>/g, " "))) throw new Error("resume: looks like a phone number; keep it out of the public repo");

const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  const footer = `<div style="width:100%;padding:0 15mm;display:flex;justify-content:space-between;font:7pt sans-serif;color:#64748b">
    <span>Manoj Kumar · DevOps &amp; Platform Engineer · mkthecoder.com</span><span><span class="pageNumber"></span> / <span class="totalPages"></span></span></div>`;
  const pdf = await page.pdf({ format: "A4", printBackground: true, displayHeaderFooter: true, headerTemplate: "<span></span>",
    footerTemplate: footer, margin: { top: "13mm", bottom: "15mm", left: "15mm", right: "15mm" } });
  const pages = (pdf.toString("latin1").match(/\/Type\s*\/Page[^s]/g) ?? []).length;
  if (pages < 1 || pages > 2) throw new Error(`resume: ${pages} pages; keep it to two A4 pages`);
  for (const out of OUT) await writeFile(out, pdf);
  console.log(`resume: wrote ${OUT.join(" and ")} (${(pdf.length / 1024).toFixed(0)} kB, ${pages} pages)`);
} finally {
  await browser.close();
}
