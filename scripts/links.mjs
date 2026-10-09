const unique = (xs) => [...new Set(xs)];

/** Links in a built page: in-page anchors, element ids, site files (a/link href, img src) and external <a> links. */
export function extractLinks(html) {
  const hrefs = [...html.matchAll(/<a\b[^>]*\shref="([^"]+)"/g)].map((m) => m[1]);
  const fileRefs = [...html.matchAll(/<(?:a|link)\b[^>]*\shref="([^"]+)"|<img\b[^>]*\ssrc="([^"]+)"/g)].map((m) => m[1] ?? m[2]);
  return {
    anchors: unique(hrefs.filter((h) => h.startsWith("#") && h.length > 1).map((h) => h.slice(1))),
    ids: unique([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1])),
    external: unique(hrefs.filter((h) => /^https?:\/\//.test(h))),
    files: unique(fileRefs.filter((h) => /^\/[^/#]/.test(h)).map((h) => h.replace(/[?#].*$/, ""))),
  };
}

// Ruling R8: credential pages on Microsoft Learn and Credly often refuse bots, so they only warn; LinkedIn always blocks.
const WARN_HOSTS = ["learn.microsoft.com", "credly.com"];
const SKIP_HOSTS = ["linkedin.com"];
const matches = (host, list) => list.some((h) => host === h || host.endsWith(`.${h}`));

export function severityFor(url) {
  const host = new URL(url).host;
  if (matches(host, SKIP_HOSTS)) return "skip";
  return matches(host, WARN_HOSTS) ? "warn" : "fail";
}

/** "" when the URL answers < 400. Some servers mishandle HEAD (Microsoft Learn returns 404), so a failed HEAD is retried as GET. */
export async function probe(url, fetchImpl = fetch) {
  const opts = { redirect: "follow", signal: AbortSignal.timeout(15000) };
  try {
    let res = await fetchImpl(url, { ...opts, method: "HEAD" });
    if (res.status >= 400) res = await fetchImpl(url, { ...opts, method: "GET" });
    return res.status >= 400 ? `HTTP ${res.status}` : "";
  } catch (e) {
    return `unreachable (${e.message})`;
  }
}
