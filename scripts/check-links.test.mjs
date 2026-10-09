import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createStaticServer } from "./serve-out.mjs";

async function site(files) {
  const dir = await mkdtemp(join(tmpdir(), "links-"));
  for (const [name, body] of Object.entries(files)) await writeFile(join(dir, name), body);
  const server = await createStaticServer(dir);
  await new Promise((r) => server.listen(0, r));
  return { server, url: `http://localhost:${server.address().port}/` };
}
// The server runs in this process, so the checker must run asynchronously.
const run = (url) => new Promise((resolve) => {
  import("node:child_process").then(({ execFile }) => execFile(process.execPath, ["scripts/check-links.mjs", "--url", url, "--offline"], (err, stdout, stderr) => resolve({ code: err ? err.code : 0, out: stdout + stderr })));
});

test("--url checks a live page: anchors and site files over HTTP", async () => {
  const ok = await site({ "index.html": '<a href="#a">a</a><p id="a"></p><img src="/b.svg"><a href="/r.pdf">r</a>', "b.svg": "<svg/>", "r.pdf": "%PDF" });
  try {
    const r = await run(ok.url);
    assert.equal(r.code, 0, r.out);
    assert.match(r.out, /check-links: OK \(1 anchors, 2 files/);
  } finally { ok.server.close(); }
});

test("--url fails when a site file is missing on the live host", async () => {
  const bad = await site({ "index.html": '<img src="/missing.svg">', "404.html": "nope" });
  try {
    const r = await run(bad.url);
    assert.notEqual(r.code, 0);
    assert.match(r.out, /missing file: \/missing\.svg/);
  } finally { bad.server.close(); }
});
