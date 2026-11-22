import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GameEvent } from "@/game/rules";
import type { Octopus, Task } from "@/game/types";

const track = vi.fn();
vi.mock("@vercel/analytics", () => ({ track: (...a: unknown[]) => track(...a) }));

const { count, countGameEvents } = await import("./analytics");

const task = { id: "t", title: "Secret title" } as Task;
const octopus = { id: "o", name: "Octavia" } as Octopus;

beforeEach(() => track.mockReset());

describe("countGameEvents", () => {
  it("counts adds, slashes and defeats, and nothing else", () => {
    const events: GameEvent[] = [
      { type: "spawned", octopus },
      { type: "grew", task },
      { type: "edited", task },
      { type: "removed", task },
      { type: "cut", task },
      { type: "defeated", octopus },
    ];
    countGameEvents(events);
    expect(track.mock.calls.map((c) => c[0])).toEqual(["task_added", "task_slashed", "octopus_defeated"]);
  });

  it("never sends what the player typed", () => {
    countGameEvents([{ type: "grew", task }, { type: "defeated", octopus }]);
    expect(JSON.stringify(track.mock.calls)).not.toContain("Secret title");
    expect(JSON.stringify(track.mock.calls)).not.toContain("Octavia");
  });
});

describe("count", () => {
  it("passes small props through and survives a failing tracker", () => {
    count("ai_used", { feature: "split" });
    expect(track).toHaveBeenCalledWith("ai_used", { feature: "split" });
    track.mockImplementationOnce(() => {
      throw new Error("blocked");
    });
    count("share_clicked"); // would fail the test if the error escaped
    expect(track).toHaveBeenCalledTimes(2);
  });
});
