import { describe, expect, it } from "vitest";
import { STAGES, layerWeight, mixHex, skyAt, stageAt } from "./stages";

describe("stageAt (continuous stage from the probe position)", () => {
  // Stage 1 ends at 1000, stage 2 at 2000, ... stage 5 at 5000; viewport 800 tall, so each boundary blends over 800px.
  const bottoms = [1000, 2000, 3000, 4000, 5000];
  const H = 800;

  it("is the stage's own number well inside it", () => {
    expect(stageAt(200, bottoms, H)).toBe(1);
    expect(stageAt(2500, bottoms, H)).toBe(3);
    expect(stageAt(9000, bottoms, H)).toBe(6);
  });

  it("is halfway between two stages exactly at their boundary", () => {
    expect(stageAt(1000, bottoms, H)).toBeCloseTo(1.5);
    expect(stageAt(4000, bottoms, H)).toBeCloseTo(4.5);
  });

  it("never runs backwards as the page scrolls down", () => {
    let prev = 0;
    for (let y = 0; y < 6000; y += 37) {
      const s = stageAt(y, bottoms, H);
      expect(s).toBeGreaterThanOrEqual(prev);
      prev = s;
    }
  });
});

describe("layerWeight", () => {
  it("is the stage's value on whole stages and blends linearly between them", () => {
    expect(layerWeight("aurora", 3)).toBe(1);
    expect(layerWeight("aurora", 2)).toBe(0);
    expect(layerWeight("aurora", 2.5)).toBeCloseTo(0.5);
    expect(layerWeight("rider", 6)).toBe(1);
  });

  it("clamps outside 1..6", () => {
    expect(layerWeight("rider", 7)).toBe(1);
    expect(layerWeight("stars", 0)).toBe(layerWeight("stars", 1));
  });
});

describe("sky colours", () => {
  it("mixes two hex colours", () => {
    expect(mixHex("#000000", "#ffffff", 0.5)).toBe("rgb(128,128,128)");
    expect(mixHex("#102030", "#102030", 0.3)).toBe("rgb(16,32,48)");
  });

  it("gives each stage its own palette on whole stages and a blend in between", () => {
    expect(skyAt(2)).toEqual(STAGES[1].sky.map((c) => mixHex(c, c, 0)));
    expect(skyAt(2.5)[0]).toBe(mixHex(STAGES[1].sky[0], STAGES[2].sky[0], 0.5));
  });

  it("defines six stages, each with four sky stops", () => {
    expect(STAGES).toHaveLength(6);
    for (const s of STAGES) expect(s.sky).toHaveLength(4);
  });
});
