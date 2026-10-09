import { test } from "node:test";
import assert from "node:assert/strict";
import { GEIST_MONO_SEMIBOLD, loadFont, capsPath } from "./glyphs.mjs";

const font = loadFont(GEIST_MONO_SEMIBOLD);

test("centres capital letters on the given point", () => {
  const { d, box } = capsPath(font, "MK", { size: 100, cx: 200, cy: 150 });
  assert.match(d, /^M/);
  assert.ok(Math.abs((box.x1 + box.x2) / 2 - 200) < 1, `x centre ${(box.x1 + box.x2) / 2}`);
  assert.ok(Math.abs((box.y1 + box.y2) / 2 - 150) < 1, `y centre ${(box.y1 + box.y2) / 2}`);
});

test("scales with the font size (cap height ≈ 0.71em in Geist Mono)", () => {
  const { box } = capsPath(font, "MK", { size: 100, cx: 0, cy: 0 });
  assert.ok(Math.abs(box.y2 - box.y1 - 71) < 1.5, `cap height ${box.y2 - box.y1}`);
});
