import { describe, it, expect } from "vitest";
import nextConfig from "../../next.config";

describe("next.config", () => {
  it("builds a static export with no server features", () => {
    expect(nextConfig.output).toBe("export");
    expect(nextConfig.images?.unoptimized).toBe(true);
    expect(nextConfig.poweredByHeader).toBe(false);
  });
  it("keeps trailing slashes so the canonical URL is https://mkthecoder.com/", () => {
    expect(nextConfig.trailingSlash).toBe(true);
  });
});
