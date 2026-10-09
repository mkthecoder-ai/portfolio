import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

// Spec 3.1: client JS is limited to the header (shrink, active section, mobile menu) and the scroll reveal.
// Spec 5.0 adds the hero motion loop; spec 5.2 the living background mount (its engine is a lazy chunk).
const ALLOWED = ["components/Header.tsx", "components/hero/DuskMotion.tsx", "components/sky/LivingSky.tsx", "components/ui/RevealObserver.tsx", "lib/hooks.ts"];
const SRC = new URL("..", import.meta.url).pathname;

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? files(path) : /\.(tsx?|jsx?)$/.test(name) && !/\.test\./.test(name) ? [path] : [];
  });
}

describe("client boundary", () => {
  const clientFiles = files(SRC).filter((f) => /^\s*["']use client["']/.test(readFileSync(f, "utf8"))).map((f) => relative(SRC, f)).sort();
  it("only the allowed files are client components", () => {
    for (const f of clientFiles) expect(ALLOWED, `${f} must not be a client component`).toContain(f);
  });
  it("the scroll reveal is a client component", () => expect(clientFiles).toContain("components/ui/RevealObserver.tsx"));
});
