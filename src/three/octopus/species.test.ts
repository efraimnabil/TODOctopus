import { describe, expect, it } from "vitest";
import { SPECIES, SPECIES_LIST, isSpeciesChoice, resolveSpecies } from "./species";

describe("resolveSpecies", () => {
  it("returns the chosen species regardless of seed", () => {
    expect(resolveSpecies("jellyfish", 7)).toBe(SPECIES.jellyfish);
  });
  it("picks a stable species per seed in random mode, and varies across seeds", () => {
    expect(resolveSpecies("random", 12)).toBe(resolveSpecies("random", 12));
    const seen = new Set(Array.from({ length: SPECIES_LIST.length }, (_, i) => resolveSpecies("random", i).id));
    expect(seen.size).toBe(SPECIES_LIST.length);
  });
  it("accepts random as a choice and rejects junk", () => {
    expect(isSpeciesChoice("random")).toBe(true);
    expect(isSpeciesChoice("kraken")).toBe(false);
  });
});
