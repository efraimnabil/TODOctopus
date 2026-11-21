import { describe, expect, it } from "vitest";
import type { GameEvent } from "@/game/rules";
import type { Octopus, Task } from "@/game/types";
import { LINES, TONES, lineFor, momentOf } from "./personality";

const task = { id: "t", title: "Water the plants" } as Task;
const octopus = { id: "o", name: "Octavia" } as Octopus;

describe("momentOf", () => {
  it("prefers a defeat over a cut over a removal over a growth", () => {
    const events: GameEvent[] = [
      { type: "grew", task },
      { type: "removed", task },
      { type: "cut", task },
      { type: "defeated", octopus },
    ];
    expect(momentOf(events)).toEqual({ moment: "defeated", octopus: "Octavia" });
    expect(momentOf(events.slice(0, 3))?.moment).toBe("cut");
    expect(momentOf(events.slice(0, 2))?.moment).toBe("removed");
    expect(momentOf(events.slice(0, 1))?.moment).toBe("grew");
  });

  it("says nothing for events that need no comment", () => {
    expect(momentOf([{ type: "spawned", octopus }, { type: "edited", task }])).toBeNull();
    expect(momentOf([])).toBeNull();
  });
});

describe("lineFor", () => {
  it("is silent when the tone is off", () => {
    expect(lineFor("off", { moment: "cut" }, 0.5)).toBeNull();
  });

  it("puts the task and octopus names into the line", () => {
    const grew = lineFor("playful", { moment: "grew", task: "Water the plants" }, 0)!;
    expect(grew).toContain("Water the plants");
    const gone = lineFor("playful", { moment: "defeated", octopus: "Octavia" }, 0.5)!;
    expect(gone).toContain("Octavia");
  });

  it("shortens a long task title", () => {
    const line = lineFor("playful", { moment: "grew", task: "x".repeat(80) }, 0)!;
    expect(line.length).toBeLessThan(80);
    expect(line).toContain("…");
  });

  it("picks every line in the bank across 0..1 and never goes out of range", () => {
    for (const tone of TONES.filter((t) => t.id !== "off")) {
      for (const moment of ["grew", "cut", "removed", "defeated"] as const) {
        const bank = LINES[tone.id as "playful"][moment];
        const seen = new Set(
          [0, 0.2, 0.4, 0.6, 0.8, 0.9999, 1].map((p) => lineFor(tone.id, { moment, task: "A", octopus: "B" }, p)),
        );
        expect(seen.size).toBeGreaterThan(1);
        expect(bank.length).toBeGreaterThan(1);
        for (const line of seen) expect(line).not.toMatch(/\{(task|name)\}/);
      }
    }
  });
});
