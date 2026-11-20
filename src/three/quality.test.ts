import { describe, expect, it } from "vitest";
import { pickQuality } from "./quality";

describe("pickQuality", () => {
  it("starts strong devices on high", () => {
    expect(pickQuality({ cores: 8, memory: 8 })).toBe("high");
    expect(pickQuality({})).toBe("high");
  });
  it("starts weak, small-memory or data-saving devices on low", () => {
    expect(pickQuality({ cores: 4 })).toBe("low");
    expect(pickQuality({ cores: 8, memory: 2 })).toBe("low");
    expect(pickQuality({ cores: 8, memory: 8, saveData: true })).toBe("low");
  });
});
