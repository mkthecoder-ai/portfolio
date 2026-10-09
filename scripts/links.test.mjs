import { test } from "node:test";
import assert from "node:assert/strict";
import { extractLinks, severityFor } from "./links.mjs";

test("extracts in-page anchors, element ids, site files and external links", () => {
  const html = `<a href="#about">a</a><section id="about"></section><a href="https://example.com/x">x</a><a href="mailto:a@b.c">m</a>`
    + `<a href="/resume.pdf">r</a><img src="/badges/a.svg"><link rel="icon" href="/favicon.ico"><a href="/">home</a>`;
  assert.deepEqual(extractLinks(html), {
    anchors: ["about"], ids: ["about"], external: ["https://example.com/x"], files: ["/resume.pdf", "/badges/a.svg", "/favicon.ico"],
  });
});

test("Microsoft Learn and Credly failures are warnings, LinkedIn is skipped, everything else fails (ruling R8)", () => {
  assert.equal(severityFor("https://learn.microsoft.com/api/credentials/share/x"), "warn");
  assert.equal(severityFor("https://www.credly.com/badges/x/public_url"), "warn");
  assert.equal(severityFor("https://www.linkedin.com/in/mkthecoder"), "skip");
  assert.equal(severityFor("https://github.com/mkthecoder-ai"), "fail");
});

test("a failed HEAD is confirmed with GET before the link counts as broken", async () => {
  const { probe } = await import("./links.mjs");
  const calls = [];
  const fake = (status) => async (url, opts) => { calls.push(opts.method ?? "GET"); return { status: opts.method === "HEAD" ? 404 : status }; };
  assert.equal(await probe("https://learn.microsoft.com/x", fake(200)), "");
  assert.deepEqual(calls, ["HEAD", "GET"]);
  assert.equal(await probe("https://example.com/gone", fake(410)), "HTTP 410");
  assert.equal(await probe("https://example.com/down", async () => { throw new Error("ECONNREFUSED"); }), "unreachable (ECONNREFUSED)");
});
