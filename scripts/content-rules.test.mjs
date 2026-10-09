import { test } from "node:test";
import assert from "node:assert/strict";
import { checkHtml, findPhones, htmlToText, launchProblems } from "./content-rules.mjs";
// A years-of-experience count, built at runtime so this file never carries the phrase itself.
const YEARS = [8, "+ years"].join("");

const page = (body) => `<html><head><script>self.__next_f.push("${YEARS}")</script></head><body>${body}</body></html>`;

test("ignores framework scripts but reads visible text", () => {
  assert.deepEqual(checkHtml(page("<p>Since 2018, I've built platforms.</p>")), []);
  assert.equal(htmlToText(page("<p>a &amp; b</p>")).trim(), "a & b");
});

test("flags a number of years in any form", () => {
  const rules = checkHtml(page(`<p>${YEARS} on Azure</p><p>with 7 yrs</p><p>+ years</p>`)).map((p) => p.rule);
  assert.ok(rules.includes("years-number"));
  assert.ok(rules.includes("plus-years"));
});

test("flags phone numbers but not date ranges", () => {
  assert.deepEqual(findPhones("Call +91 98765 43210 now"), ["+91 98765 43210"]);
  assert.deepEqual(findPhones("Feb 2018 – Sep 2019 and 2014-2018"), []);
});

test("flags em dashes, placeholders, availability wording and the old LinkedIn URL", () => {
  const rules = checkHtml(page(
    '<p>a — b</p><p>[add when ready]</p><p>DRAFT</p><p>Open to remote roles</p><a href="https://www.linkedin.com/in/manojkumarm0107">x</a>',
  )).map((p) => p.rule).sort();
  assert.deepEqual(rules, ["availability", "em-dash", "old-linkedin", "placeholder", "placeholder"]);
});

test("allows the contact email address", () => {
  assert.deepEqual(checkHtml(page('<a href="mailto:manojkumarm0107@gmail.com">manojkumarm0107@gmail.com</a>')), []);
});

test("launch mode needs the résumé and no missing markers", () => {
  const html = page('<li data-missing="cert-url"></li>');
  assert.deepEqual(launchProblems(html, () => false).sort(), ["missing file: Manoj_Kumar_M_Resume.pdf", "missing: cert-url"]);
  assert.deepEqual(launchProblems(page("<p>ok</p>"), () => true), []);
});

test("launch mode never asks for a photo (spec 3.2: the hero is the MK monogram)", () => {
  const asked = [];
  launchProblems(page("<p>ok</p>"), (file) => { asked.push(file); return true; });
  assert.deepEqual(asked, ["Manoj_Kumar_M_Resume.pdf"]);
});
