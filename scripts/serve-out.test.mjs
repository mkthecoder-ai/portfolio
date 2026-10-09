import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createStaticServer } from "./serve-out.mjs";

test("serves files with the SWA global headers and a 404 page", async () => {
  const dir = await mkdtemp(join(tmpdir(), "out-"));
  await writeFile(join(dir, "index.html"), "<h1>home</h1>");
  await writeFile(join(dir, "404.html"), "<h1>missing</h1>");
  await writeFile(join(dir, "staticwebapp.config.json"), JSON.stringify({ globalHeaders: { "X-Test": "yes" } }));
  const server = await createStaticServer(dir);
  await new Promise((resolve) => server.listen(0, resolve));
  const { port } = server.address();
  try {
    const home = await fetch(`http://localhost:${port}/`);
    assert.equal(home.status, 200);
    assert.equal(home.headers.get("x-test"), "yes");
    const missing = await fetch(`http://localhost:${port}/nope`);
    assert.equal(missing.status, 404);
    assert.match(await missing.text(), /missing/);
  } finally {
    server.close();
  }
});

test("compresses text responses with gzip when asked, as Static Web Apps does; never images", async () => {
  const { request } = await import("node:http");
  const { gunzipSync } = await import("node:zlib");
  const dir = await mkdtemp(join(tmpdir(), "out-"));
  const html = `<h1>${"home ".repeat(500)}</h1>`;
  await writeFile(join(dir, "index.html"), html);
  await writeFile(join(dir, "a.png"), Buffer.alloc(2000, 1));
  const server = await createStaticServer(dir);
  await new Promise((resolve) => server.listen(0, resolve));
  const { port } = server.address();
  const get = (path) => new Promise((resolve, reject) => {
    request({ port, path, headers: { "Accept-Encoding": "gzip, br" } }, (res) => {
      const chunks = []; res.on("data", (c) => chunks.push(c)); res.on("end", () => resolve({ res, body: Buffer.concat(chunks) }));
    }).on("error", reject).end();
  });
  try {
    const home = await get("/");
    assert.equal(home.res.headers["content-encoding"], "gzip");
    assert.equal(home.res.headers.vary, "Accept-Encoding");
    assert.equal(gunzipSync(home.body).toString(), html);
    const png = await get("/a.png");
    assert.equal(png.res.headers["content-encoding"], undefined);
    assert.equal(png.body.length, 2000);
  } finally {
    server.close();
  }
});
