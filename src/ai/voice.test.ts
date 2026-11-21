import { describe, expect, it } from "vitest";
import { LAST_WORDS_MAX, tidyLine } from "./voice";

describe("tidyLine", () => {
  it("flattens whitespace and trims", () => {
    expect(tidyLine("  Farewell,\n\ncruel   world  ")).toBe("Farewell, cruel world");
  });
  it("keeps it short enough for the speech card", () => {
    expect(tidyLine("a".repeat(500))).toHaveLength(LAST_WORDS_MAX);
  });
});
