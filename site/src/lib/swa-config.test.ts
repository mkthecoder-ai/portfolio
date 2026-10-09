import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";

const config = JSON.parse(readFileSync(new URL("../../public/staticwebapp.config.json", import.meta.url), "utf8"));

describe("staticwebapp.config.json", () => {
  it("sends the agreed CSP (accepted trade-off: unsafe-inline for scripts and styles)", () => {
    expect(config.globalHeaders["Content-Security-Policy"]).toBe(
      "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; media-src 'self'; font-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'none'",
    );
  });
  it("sends the other security headers", () => {
    expect(config.globalHeaders).toMatchObject({
      "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    });
  });
  it("serves the designed 404 and caches hashed assets forever", () => {
    expect(config.responseOverrides["404"].rewrite).toBe("/404.html");
    expect(config.routes.find((r: { route: string }) => r.route === "/_next/static/*").headers["Cache-Control"]).toBe("public, max-age=31536000, immutable");
  });
});
