import { describe, expect, it } from "vitest";
import { filterTasks, nextUp, onboardingStep, sortTasks, stepSelection, trophies } from "./view";
import type { GameState, Octopus, Priority, Task, TaskStatus } from "./types";

const task = (
  id: string,
  priority: Priority,
  createdAt: number,
  status: TaskStatus = "open",
  octopusId = "o1",
  completedAt: number | null = null,
): Task => ({
  id,
  octopusId,
  slot: 0,
  title: id,
  description: "",
  priority,
  status,
  createdAt,
  completedAt,
  cutIndex: null,
  dueAt: null,
});

const octopus = (id: string, status: Octopus["status"], defeatedAt: number | null): Octopus => ({
  id,
  name: id,
  seed: 1,
  status,
  createdAt: 0,
  defeatedAt,
});

const sample = [task("a", 1, 10), task("b", 3, 30), task("c", 3, 20), task("d", 2, 40)];

describe("sortTasks", () => {
  it("puts high priority first, oldest first within a priority", () => {
    expect(sortTasks(sample, "priority").map((t) => t.id)).toEqual(["c", "b", "d", "a"]);
  });
  it("sorts by age", () => {
    expect(sortTasks(sample, "newest").map((t) => t.id)).toEqual(["d", "b", "c", "a"]);
    expect(sortTasks(sample, "oldest").map((t) => t.id)).toEqual(["a", "c", "b", "d"]);
  });
  it("puts the soonest deadline first, tasks without one last", () => {
    const list = [
      { ...task("none", 3, 1), dueAt: null },
      { ...task("late", 1, 2), dueAt: 500 },
      { ...task("soon", 1, 3), dueAt: 100 },
    ];
    expect(sortTasks(list, "due").map((t) => t.id)).toEqual(["soon", "late", "none"]);
  });
  it("does not mutate its input", () => {
    const copy = [...sample];
    sortTasks(sample, "newest");
    expect(sample).toEqual(copy);
  });
});

describe("stepSelection", () => {
  const list = [task("a", 1, 1), task("b", 1, 2), task("c", 1, 3)];
  it("starts at the first or last task when nothing is selected", () => {
    expect(stepSelection(list, null, 1)).toBe("a");
    expect(stepSelection(list, null, -1)).toBe("c");
  });
  it("moves and wraps", () => {
    expect(stepSelection(list, "a", 1)).toBe("b");
    expect(stepSelection(list, "c", 1)).toBe("a");
    expect(stepSelection(list, "a", -1)).toBe("c");
  });
  it("has nothing to select in an empty list", () => {
    expect(stepSelection([], null, 1)).toBeNull();
  });
});

describe("filterTasks", () => {
  it("keeps one priority, or everything", () => {
    expect(filterTasks(sample, 3).map((t) => t.id)).toEqual(["b", "c"]);
    expect(filterTasks(sample, "all")).toHaveLength(4);
  });
});

describe("onboardingStep", () => {
  const game = (tasks: Task[]): GameState => ({ octopuses: [], tasks });
  it("asks a newcomer to add a task", () => {
    expect(onboardingStep(game([]))).toBe("add");
  });
  it("asks for a first slash once there are open tasks", () => {
    expect(onboardingStep(game([task("a", 1, 1)]))).toBe("slash");
  });
  it("is over after the first slash", () => {
    expect(onboardingStep(game([task("a", 1, 1, "done"), task("b", 1, 2)]))).toBe("done");
  });
  it("does not nag someone whose only tasks were deleted", () => {
    expect(onboardingStep(game([task("a", 1, 1, "removed")]))).toBe("done");
  });
});

describe("trophies", () => {
  it("lists defeated octopuses newest first with their slashed tasks", () => {
    const game: GameState = {
      octopuses: [
        octopus("o1", "defeated", 100),
        octopus("o2", "alive", null),
        octopus("o3", "defeated", 300),
      ],
      tasks: [
        task("x", 1, 1, "done", "o1", 60),
        task("y", 1, 2, "done", "o1", 50),
        task("z", 1, 3, "removed", "o1"),
        task("w", 1, 4, "open", "o2"),
        task("v", 1, 5, "done", "o3", 250),
      ],
    };
    const list = trophies(game);
    expect(list.map((t) => t.octopusId)).toEqual(["o3", "o1"]);
    expect(list[1].tasks.map((t) => t.id)).toEqual(["y", "x"]);
  });
});

describe("nextUp", () => {
  const NOW = Date.UTC(2026, 10, 21, 12);
  const DAY = 24 * 60 * 60 * 1000;
  const t = (id: string, over: Partial<Task> = {}): Task => ({
    id,
    octopusId: "o",
    slot: 0,
    title: id,
    description: "",
    priority: 2,
    status: "open",
    createdAt: 1,
    completedAt: null,
    cutIndex: null,
    dueAt: null,
    ...over,
  });

  it("is null with nothing open", () => {
    expect(nextUp([], NOW)).toBeNull();
    expect(nextUp([t("a", { status: "done" })], NOW)).toBeNull();
  });

  it("puts the most overdue task first, whatever the priorities", () => {
    const pick = nextUp(
      [
        t("high", { priority: 3 }),
        t("late", { priority: 1, dueAt: NOW - DAY }),
        t("later", { priority: 3, dueAt: NOW - 3 * DAY }),
      ],
      NOW,
    );
    expect(pick?.task.id).toBe("later");
    expect(pick?.reason).toMatch(/Overdue/);
  });

  it("prefers something due within two days over plain high priority", () => {
    const pick = nextUp([t("high", { priority: 3 }), t("soon", { dueAt: NOW + DAY })], NOW);
    expect(pick?.task.id).toBe("soon");
    expect(pick?.reason).toBe("Due tomorrow");
  });

  it("falls back to high priority, then the oldest of equals", () => {
    expect(nextUp([t("a"), t("b", { priority: 3 })], NOW)).toMatchObject({
      task: { id: "b" },
      reason: "High priority",
    });
    expect(nextUp([t("new", { createdAt: 9 }), t("old", { createdAt: 2 })], NOW)).toMatchObject({
      task: { id: "old" },
      reason: "Next in line",
    });
  });
});
