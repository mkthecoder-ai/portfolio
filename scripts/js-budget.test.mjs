import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { gzipSync } from "node:zlib";
import { firstLoadJsBytes } from "./js-budget.mjs";

test("sums the gzipped size of each distinct <script src> on index.html", async () => {
  const dir = await mkdtemp(join(tmpdir(), "out-"));
  await mkdir(join(dir, "_next"), { recursive: true });
  const a = "console.log('a');".repeat(50);
  const b = "console.log('b');".repeat(80);
  await writeFile(join(dir, "_next", "a.js"), a);
  await writeFile(join(dir, "_next", "b.js"), b);
  await writeFile(join(dir, "index.html"), '<script src="/_next/a.js"></script><script src="/_next/b.js" async></script><script src="/_next/a.js"></script>');
  const { total, files } = await firstLoadJsBytes(dir);
  assert.equal(files, 2);
  assert.equal(total, gzipSync(a).length + gzipSync(b).length);
});

test("ignores nomodule scripts, which modern browsers never download", async () => {
  const dir = await mkdtemp(join(tmpdir(), "out-"));
  await mkdir(join(dir, "_next"), { recursive: true });
  const app = "console.log('app');".repeat(40);
  await writeFile(join(dir, "_next", "app.js"), app);
  await writeFile(join(dir, "_next", "polyfills.js"), "var polyfill = 1;".repeat(400));
  await writeFile(join(dir, "index.html"), '<script src="/_next/polyfills.js" noModule=""></script><script src="/_next/app.js" async=""></script>');
  const { total, files } = await firstLoadJsBytes(dir);
  assert.equal(files, 1);
  assert.equal(total, gzipSync(app).length);
});
