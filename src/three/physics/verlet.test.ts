import { describe, expect, it } from "vitest";
import {
  collideFloor,
  createChain,
  integrate,
  maxSegmentError,
  pinPoint,
  solveDistances,
} from "./verlet";

function straightChain(count: number, rest: number) {
  const c = createChain(count, rest);
  for (let i = 0; i < count; i++) pinPoint(c, i, i * rest, 2, 0);
  return c;
}

describe("verlet chain", () => {
  it("keeps segment lengths under gravity", () => {
    const c = straightChain(20, 0.1);
    for (let step = 0; step < 240; step++) {
      integrate(c, 1 / 60, -9.8, 0.98, 1);
      solveDistances(c, 12, 1);
    }
    expect(maxSegmentError(c)).toBeLessThan(0.05);
  });

  it("never moves pinned points", () => {
    const c = straightChain(10, 0.1);
    for (let step = 0; step < 60; step++) {
      integrate(c, 1 / 60, -9.8, 0.98, 2);
      solveDistances(c, 8, 2);
    }
    expect(Array.from(c.pos.slice(0, 6))).toEqual([0, 2, 0, 0.1, 2, 0].map(Math.fround));
  });

  it("stops points at the floor plus their radius", () => {
    const c = straightChain(10, 0.1);
    for (let step = 0; step < 300; step++) {
      integrate(c, 1 / 60, -9.8, 0.98, 0);
      solveDistances(c, 4, 0);
      collideFloor(c, 0, () => 0.05, 0.3);
    }
    for (let i = 0; i < c.count; i++) {
      expect(c.pos[i * 3 + 1]).toBeGreaterThanOrEqual(0.05 - 1e-6);
    }
  });

  it("only simulates the active count", () => {
    const c = straightChain(10, 0.1);
    c.count = 4;
    integrate(c, 1 / 60, -9.8, 1, 0);
    integrate(c, 1 / 60, -9.8, 1, 0);
    expect(c.pos[3 * 3 + 1]).toBeLessThan(2);
    expect(c.pos[5 * 3 + 1]).toBe(2);
  });
});
