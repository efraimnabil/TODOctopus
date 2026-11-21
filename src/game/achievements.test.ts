import { describe, expect, it } from "vitest";
import { achievements, activity, bestDay, longestStreak } from "./achievements";
import type { GameState, Octopus, Task } from "./types";

const day = (n: number, hour = 12) => new Date(2026, 10, n, hour).getTime();

let id = 0;
const done = (completedAt: number, extra: Partial<Task> = {}, octopusId = "o1"): Task => ({
  id: `t${++id}`,
  octopusId,
  slot: 0,
  title: "x",
  description: "",
  priority: 2,
  status: "done",
  createdAt: completedAt - 1000,
  completedAt,
  cutIndex: null,
  dueAt: null,
  ...extra,
});

const octopus = (over: Partial<Octopus> = {}): Octopus => ({
  id: "o1",
  name: "Octo",
  seed: 1,
  status: "alive",
  createdAt: day(1),
  defeatedAt: null,
  ...over,
});

const game = (tasks: Task[], octopuses: Octopus[] = [octopus()]): GameState => ({ octopuses, tasks });
const earned = (g: GameState) => achievements(g).filter((a) => a.earned).map((a) => a.id);

describe("streaks and busy days", () => {
  it("finds the longest run of consecutive days", () => {
    const g = game([done(day(1)), done(day(2)), done(day(3)), done(day(10)), done(day(11))]);
    expect(longestStreak(g)).toBe(3);
    expect(longestStreak(game([]))).toBe(0);
  });
  it("counts the busiest day", () => {
    expect(bestDay(game([done(day(1, 9)), done(day(1, 10)), done(day(2))]))).toBe(2);
  });
});

describe("achievements", () => {
  it("starts with nothing earned", () => {
    expect(earned(game([]))).toEqual([]);
  });

  it("awards the first slash and tracks progress", () => {
    const g = game([done(day(1))]);
    expect(earned(g)).toEqual(["first-slash"]);
    expect(achievements(g).find((a) => a.id === "ten-slashes")?.progress).toEqual({ have: 1, need: 10 });
  });

  it("awards a defeat, a speed run and a full house", () => {
    const tasks = Array.from({ length: 8 }, (_, i) => done(day(2, 8 + i)));
    const g = game(tasks, [octopus({ status: "defeated", createdAt: day(2, 6), defeatedAt: day(2, 20) })]);
    const ids = earned(g);
    expect(ids).toEqual(expect.arrayContaining(["first-slash", "first-defeat", "speed-run", "full-house", "busy-day"]));
    expect(ids).not.toContain("five-defeats");
  });

  it("does not give a speed run for a slow kill", () => {
    const g = game([done(day(9))], [octopus({ status: "defeated", createdAt: day(1), defeatedAt: day(9) })]);
    expect(earned(g)).not.toContain("speed-run");
  });

  it("counts only tasks finished before their deadline as punctual", () => {
    const early = (n: number) => done(day(n), { dueAt: day(n, 23) });
    const late = done(day(8), { dueAt: day(7) });
    expect(earned(game([early(1), early(2), late]))).not.toContain("on-time");
    expect(earned(game([early(1), early(2), early(3)]))).toContain("on-time");
  });
});

describe("activity", () => {
  it("gives one entry per day, oldest first, ending today", () => {
    const g = game([done(day(21, 9)), done(day(21, 15)), done(day(19))]);
    const a = activity(g, day(21, 18), 4);
    expect(a.map((d) => d.count)).toEqual([0, 1, 0, 2]);
    expect(a).toHaveLength(4);
  });
});
