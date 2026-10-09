import { test } from "node:test";
import assert from "node:assert/strict";
import { blend, contrastRatio } from "./contrast.mjs";

test("contrast ratio of black on white is 21:1 and equal colours is 1:1", () => {
  assert.equal(contrastRatio("#000000", "#ffffff").toFixed(2), "21.00");
  assert.equal(contrastRatio("#22d3ee", "#22d3ee").toFixed(2), "1.00");
});

test("the palette ratios match the spec table", () => {
  assert.equal(contrastRatio("#94a3b8", "#0d1420").toFixed(2), "7.20");
  assert.equal(contrastRatio(blend("rgba(248, 250, 252, 0.4)", "#070a0f"), "#070a0f").toFixed(2), "3.65");
});
