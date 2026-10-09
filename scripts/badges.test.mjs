import { test } from "node:test";
import assert from "node:assert/strict";
import { safeSvg } from "./badges.mjs";

test("accepts a plain path-only SVG", () => {
  const svg = '<svg viewBox="0 0 10 10" xmlns="http://www.w3.org/2000/svg"><path d="M0 0h10v10z" fill="#fff"/></svg>';
  assert.equal(safeSvg(svg, "ok.svg"), svg);
});

test("rejects scripts, event handlers, foreignObject and external references", () => {
  for (const bad of [
    '<svg><script>alert(1)</script></svg>',
    '<svg><path onload="x()" d="M0 0"/></svg>',
    '<svg><foreignObject><div/></foreignObject></svg>',
    '<svg><image href="https://example.com/a.png"/></svg>',
    '<svg><use xlink:href="//example.com/s.svg#a"/></svg>',
  ]) assert.throws(() => safeSvg(bad, "bad.svg"), /bad\.svg: unsafe SVG/, bad);
});
