import { test } from "node:test";
import assert from "node:assert/strict";
import { normaliseSvg } from "./copy-logos.mjs";

test("normaliseSvg makes a devicon SVG theme-able and inert", () => {
  const raw = `<?xml version="1.0"?><!-- c --><svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128" class="x"><defs><linearGradient id="a"/></defs><style>.s{fill:red}</style><rect width="10" height="12" fill="#0078d4"/><path style="fill:#fff" d="M0 0h1"/><path fill="none" d="M1 1"/></svg>`;
  const out = normaliseSvg(raw);
  assert.match(out, /^<svg fill="currentColor" aria-hidden="true" focusable="false" xmlns="http:\/\/www\.w3\.org\/2000\/svg" viewBox="0 0 128 128">/);
  assert.match(out, /<rect width="10" height="12"\/>/, "inner sizes are kept");
  assert.doesNotMatch(out, /#0078d4|style=|<style|<defs|<\?xml|<!--|class=/);
  assert.match(out, /fill="none"/, "explicit fill=none is kept");
});

test("builds one sprite with a symbol per logo, keeping each viewBox and dropping the per-icon svg attributes", async () => {
  const { buildSprite } = await import("./copy-logos.mjs");
  const sprite = buildSprite({
    a: { svg: '<svg fill="currentColor" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M1 1"/></svg>' },
    b: { svg: '<svg fill="currentColor" aria-hidden="true" focusable="false" viewBox="0 0 128 128"><path d="M2 2"/><path d="M3 3"/></svg>' },
  });
  assert.equal(sprite,
    '<svg xmlns="http://www.w3.org/2000/svg">'
    + '<symbol id="logo-a" viewBox="0 0 24 24"><path d="M1 1"/></symbol>'
    + '<symbol id="logo-b" viewBox="0 0 128 128"><path d="M2 2"/><path d="M3 3"/></symbol>'
    + "</svg>\n");
});
