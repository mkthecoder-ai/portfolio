#!/usr/bin/env node
// Serves a Next.js static export the way Azure Static Web Apps does for this site:
// index.html for "/", 404.html for misses, the globalHeaders from staticwebapp.config.json, and gzip for text
// (SWA compresses text responses, so Lighthouse runs against this server see production-like transfer sizes).
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { gzipSync } from "node:zlib";

const TYPES = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".json": "application/json", ".txt": "text/plain; charset=utf-8", ".xml": "application/xml",
  ".svg": "image/svg+xml", ".png": "image/png", ".webp": "image/webp", ".avif": "image/avif", ".ico": "image/x-icon",
  ".woff2": "font/woff2", ".pdf": "application/pdf",
};

const COMPRESSIBLE = /^(text\/|application\/(json|xml)|image\/svg\+xml)/;

async function isFile(path) {
  try { return (await stat(path)).isFile(); } catch { return false; }
}

export async function createStaticServer(root) {
  const base = resolve(root);
  let headers = {};
  try { headers = JSON.parse(await readFile(join(base, "staticwebapp.config.json"), "utf8")).globalHeaders ?? {}; } catch { /* none yet */ }
  return createServer(async (req, res) => {
    const safe = normalize(decodeURIComponent((req.url ?? "/").split("?")[0])).replace(/^(\.\.[/\\])+/, "");
    let file = null;
    for (const candidate of [join(base, safe), join(base, safe, "index.html"), join(base, `${safe}.html`)]) {
      if (candidate.startsWith(base) && (await isFile(candidate))) { file = candidate; break; }
    }
    const path = file ?? join(base, "404.html");
    try {
      const type = TYPES[extname(path)] ?? "application/octet-stream";
      let body = await readFile(path);
      const extra = {};
      if (COMPRESSIBLE.test(type) && /\bgzip\b/.test(req.headers["accept-encoding"] ?? "")) {
        body = gzipSync(body);
        Object.assign(extra, { "Content-Encoding": "gzip", Vary: "Accept-Encoding" });
      }
      res.writeHead(file ? 200 : 404, { "Content-Type": type, ...extra, ...headers });
      res.end(body);
    } catch {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8", ...headers });
      res.end("Not found");
    }
  });
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const root = process.argv[2] ?? "site/out";
  const port = Number(process.argv[3] ?? 3000);
  const server = await createStaticServer(root);
  server.listen(port, () => console.log(`Serving ${root} on http://localhost:${port}`));
}
