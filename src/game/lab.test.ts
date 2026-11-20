import { describe, expect, it } from "vitest";
import { MAX_TENTACLES, createLabState, freeSlot, labReducer, type LabState } from "./lab";

function emptyOctopusState(): LabState {
  const s = createLabState(3);
  return { ...s, octopus: { ...s.octopus, tentacles: [] } };
}

describe("lab rules", () => {
  it("grows tentacles into the lowest free slot, up to 8", () => {
    let s = emptyOctopusState();
    for (let i = 0; i < MAX_TENTACLES + 2; i++) {
      s = labReducer(s, { type: "grow", title: `task ${i}`, priority: 2 });
    }
    expect(s.octopus.tentacles.map((t) => t.slot)).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
    expect(freeSlot(s.octopus)).toBeNull();
  });

  it("ignores empty titles", () => {
    const s = labReducer(emptyOctopusState(), { type: "grow", title: "  ", priority: 1 });
    expect(s.octopus.tentacles).toHaveLength(0);
  });

  it("kills the octopus when its last tentacle is cut", () => {
    let s = emptyOctopusState();
    s = labReducer(s, { type: "grow", title: "a", priority: 1 });
    s = labReducer(s, { type: "grow", title: "b", priority: 1 });
    const [a, b] = s.octopus.tentacles;
    s = labReducer(s, { type: "cut", id: a.id });
    expect(s.octopus.status).toBe("alive");
    s = labReducer(s, { type: "cut", id: b.id, cutIndex: 10 });
    expect(s.octopus.status).toBe("dying");
    expect(s.octopus.tentacles[1].cutIndex).toBe(10);
    s = labReducer(s, { type: "dead" });
    expect(s.octopus.status).toBe("dead");
    expect(s.kills).toBe(1);
  });

  it("a deleted tentacle frees its slot and gives no kill on its own", () => {
    let s = emptyOctopusState();
    s = labReducer(s, { type: "grow", title: "a", priority: 1 });
    const id = s.octopus.tentacles[0].id;
    s = labReducer(s, { type: "retract", id });
    expect(s.octopus.status).toBe("alive");
    s = labReducer(s, { type: "retracted", id });
    expect(s.octopus.tentacles).toHaveLength(0);
    expect(freeSlot(s.octopus)).toBe(0);
  });

  it("cut stumps keep their slot", () => {
    let s = emptyOctopusState();
    s = labReducer(s, { type: "grow", title: "a", priority: 1 });
    s = labReducer(s, { type: "grow", title: "b", priority: 1 });
    s = labReducer(s, { type: "cut", id: s.octopus.tentacles[0].id });
    s = labReducer(s, { type: "grow", title: "c", priority: 1 });
    expect(s.octopus.tentacles.map((t) => t.slot)).toEqual([0, 1, 2]);
  });

  it("spawns a fresh octopus only after death", () => {
    const s = createLabState(3);
    expect(labReducer(s, { type: "spawn", seed: 9 })).toBe(s);
  });
});
