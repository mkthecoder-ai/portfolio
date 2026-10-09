import { describe, it, expect } from "vitest";
import { LOGOS } from "./logos.generated";
import { LINE_ICONS } from "./line-icons";

const REQUIRED = [
  "azure", "azuredevops", "linkedin", "github", "kubernetes", "docker", "helm", "dapr", "terraform", "gitlab",
  "jenkins", "git", "sonarqubecloud", "trivy", "jfrog", "prometheus", "grafana", "datadog", "elasticstack",
  "python", "gnubash", "yaml", "postgresql", "redis", "cilium",
];

describe("logos", () => {
  it("has every required logo as an inline, theme-able, inert SVG", () => {
    for (const slug of REQUIRED) {
      const logo = LOGOS[slug as keyof typeof LOGOS];
      expect(logo, slug).toBeDefined();
      expect(logo.svg, slug).toMatch(/^<svg fill="currentColor" aria-hidden="true"/);
      expect(logo.svg, slug).not.toMatch(/<script|\son\w+=|javascript:/i);
      expect(["CC0-1.0", "MIT"]).toContain(logo.license);
    }
  });
});

describe("line icons", () => {
  it("has non-empty markup for every icon", () => {
    for (const [name, markup] of Object.entries(LINE_ICONS)) expect(markup.length, name).toBeGreaterThan(10);
  });
});
