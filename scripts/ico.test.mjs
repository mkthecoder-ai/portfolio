import { test } from "node:test";
import assert from "node:assert/strict";
import { pngToIco, pngsToIco } from "./ico.mjs";

test("wraps a PNG in a single-image ICO container", () => {
  const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 1, 2, 3]);
  const ico = pngToIco(png, 32);
  assert.equal(ico.readUInt16LE(2), 1);
  assert.equal(ico.readUInt16LE(4), 1);
  assert.equal(ico.readUInt8(6), 32);
  assert.equal(ico.readUInt32LE(14), png.length);
  assert.equal(ico.readUInt32LE(18), 22);
  assert.deepEqual(ico.subarray(22), png);
});

test("writes 0 for the 256px dimension, as the ICO format requires", () => {
  const ico = pngToIco(Buffer.from([1]), 256);
  assert.equal(ico.readUInt8(6), 0);
  assert.equal(ico.readUInt8(7), 0);
});

test("packs several PNG sizes into one ICO, each entry pointing at its own image", () => {
  const a = Buffer.from([1, 1]), b = Buffer.from([2, 2, 2]), c = Buffer.from([3]);
  const ico = pngsToIco([{ png: a, size: 16 }, { png: b, size: 32 }, { png: c, size: 48 }]);
  assert.equal(ico.readUInt16LE(4), 3);
  const entries = [0, 1, 2].map((i) => ({ size: ico.readUInt8(6 + i * 16), len: ico.readUInt32LE(6 + i * 16 + 8), off: ico.readUInt32LE(6 + i * 16 + 12) }));
  assert.deepEqual(entries.map((e) => e.size), [16, 32, 48]);
  assert.equal(entries[0].off, 6 + 3 * 16);
  assert.deepEqual(ico.subarray(entries[1].off, entries[1].off + entries[1].len), b);
  assert.deepEqual(ico.subarray(entries[2].off), c);
});
