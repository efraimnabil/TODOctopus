import { describe, expect, it } from "vitest";
import {
  MAX_TENTACLES,
  RuleError,
  apply,
  computeStats,
  emptyGame,
  freeSlot,
  livingOctopuses,
  nextHome,
  pickName,
  tentaclesOf,
  type GameCommand,
} from "./rules";
import type { GameState, Priority } from "./types";

let n = 0;
const T0 = new Date(2026, 10, 21, 12).getTime();

function add(state: GameState, title = `task ${n}`, priority: Priority = 2, at = T0) {
  n++;
  return apply(state, {
    type: "addTask",
    taskId: `t${n}`,
    input: { title, priority },
    at,
    spawn: { id: `o${n}`, name: `Octo ${n}`, seed: n },
  });
}

function run(state: GameState, ...commands: GameCommand[]) {
  return commands.reduce((s, c) => apply(s, c).state, state);
}

function fill(state: GameState, count: number) {
  for (let i = 0; i < count; i++) state = add(state).state;
  return state;
}

const complete = (taskId: string, at = T0, cutIndex?: number): GameCommand => ({
  type: "completeTask",
  taskId,
  at,
  cutIndex,
});
const remove = (taskId: string, at = T0): GameCommand => ({ type: "removeTask", taskId, at });

describe("adding tasks", () => {
  it("spawns the first octopus with the first task", () => {
    const { state, events } = add(emptyGame(), "Call mom", 3);
    expect(state.octopuses).toHaveLength(1);
    expect(state.tasks[0]).toMatchObject({
      title: "Call mom",
      priority: 3,
      slot: 0,
      status: "open",
      description: "",
      octopusId: state.octopuses[0].id,
    });
    expect(events.map((e) => e.type)).toEqual(["spawned", "grew"]);
  });

  it("fills one octopus to 8 tentacles before spawning the next", () => {
    const state = fill(emptyGame(), MAX_TENTACLES + 1);
    expect(state.octopuses).toHaveLength(2);
    const [first, second] = state.octopuses;
    expect(tentaclesOf(state, first.id).map((t) => t.slot)).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
    expect(tentaclesOf(state, second.id).map((t) => t.slot)).toEqual([0]);
  });

  it("grows into the oldest living octopus that has room", () => {
    let state = fill(emptyGame(), MAX_TENTACLES + 1); // octopus A full, B has 1
    const [a] = state.octopuses;
    state = run(state, remove(tentaclesOf(state, a.id)[3].id));
    const { state: next, events } = add(state);
    expect(events.map((e) => e.type)).toEqual(["grew"]);
    const task = next.tasks.at(-1)!;
    expect(task.octopusId).toBe(a.id);
    expect(task.slot).toBe(3);
  });

  it("never reuses a cut stump's slot", () => {
    let state = fill(emptyGame(), 2);
    state = run(state, complete(state.tasks[0].id));
    state = add(state).state;
    expect(state.tasks.map((t) => t.slot)).toEqual([0, 1, 2]);
  });

  it("trims input and rejects an empty title", () => {
    const { state } = add(emptyGame(), "  Read  ");
    expect(state.tasks[0].title).toBe("Read");
    expect(() => add(emptyGame(), "   ")).toThrow(RuleError);
  });

  it("rejects a bad priority", () => {
    expect(() => add(emptyGame(), "x", 4 as Priority)).toThrow(RuleError);
  });
});

describe("finishing and deleting", () => {
  it("cutting the last tentacle defeats the octopus", () => {
    let state = fill(emptyGame(), 2);
    const [a, b] = state.tasks;
    state = run(state, complete(a.id));
    expect(state.octopuses[0].status).toBe("alive");
    const later = T0 + 1000;
    const { state: next, events } = apply(state, complete(b.id, later, 11));
    expect(events.map((e) => e.type)).toEqual(["cut", "defeated"]);
    expect(next.octopuses[0]).toMatchObject({ status: "defeated", defeatedAt: later });
    expect(next.tasks[1]).toMatchObject({ status: "done", completedAt: later, cutIndex: 11 });
  });

  it("deleting the last open task defeats an octopus that has stumps", () => {
    let state = fill(emptyGame(), 2);
    state = run(state, complete(state.tasks[0].id));
    const { events } = apply(state, remove(state.tasks[1].id));
    expect(events.map((e) => e.type)).toEqual(["removed", "defeated"]);
  });

  it("deleting every task of a fresh octopus leaves it alive and empty", () => {
    let state = fill(emptyGame(), 1);
    state = run(state, remove(state.tasks[0].id));
    expect(state.octopuses[0].status).toBe("alive");
    expect(tentaclesOf(state, state.octopuses[0].id)).toHaveLength(0);
    expect(nextHome(state)?.id).toBe(state.octopuses[0].id);
  });

  it("a deleted task frees its slot and is no tentacle", () => {
    let state = fill(emptyGame(), 3);
    state = run(state, remove(state.tasks[1].id));
    const id = state.octopuses[0].id;
    expect(freeSlot(state, id)).toBe(1);
    expect(tentaclesOf(state, id).map((t) => t.slot)).toEqual([0, 2]);
  });

  it("a task can only be finished or deleted while open", () => {
    let state = fill(emptyGame(), 2);
    const id = state.tasks[0].id;
    state = run(state, complete(id));
    expect(() => apply(state, complete(id))).toThrow(RuleError);
    expect(() => apply(state, remove(id))).toThrow(RuleError);
    expect(() => apply(state, complete("nope"))).toThrow(RuleError);
  });

  it("a defeated octopus never gets new tasks", () => {
    let state = fill(emptyGame(), 1);
    state = run(state, complete(state.tasks[0].id));
    const { state: next, events } = add(state);
    expect(events[0].type).toBe("spawned");
    expect(livingOctopuses(next)).toHaveLength(1);
    expect(next.tasks.at(-1)!.octopusId).not.toBe(state.octopuses[0].id);
  });
});

describe("editing", () => {
  it("changes title, description and priority of an open task", () => {
    let state = fill(emptyGame(), 1);
    const id = state.tasks[0].id;
    state = run(state, {
      type: "editTask",
      taskId: id,
      patch: { title: " New ", description: "details", priority: 3 },
    });
    expect(state.tasks[0]).toMatchObject({ title: "New", description: "details", priority: 3, slot: 0 });
  });

  it("keeps fields that aren't in the patch", () => {
    let state = add(emptyGame(), "Keep me", 1).state;
    state = run(state, { type: "editTask", taskId: state.tasks[0].id, patch: { priority: 3 } });
    expect(state.tasks[0]).toMatchObject({ title: "Keep me", priority: 3 });
  });

  it("rejects an empty title", () => {
    const state = fill(emptyGame(), 1);
    expect(() =>
      apply(state, { type: "editTask", taskId: state.tasks[0].id, patch: { title: "" } }),
    ).toThrow(RuleError);
  });
});

describe("names", () => {
  it("avoids names a living octopus already has", () => {
    let state = emptyGame();
    state = apply(state, {
      type: "addTask",
      taskId: "t",
      input: { title: "x", priority: 1 },
      at: T0,
      spawn: { id: "o", name: "Inky Malone", seed: 1 },
    }).state;
    for (let r = 0; r < 1; r += 0.05) expect(pickName(state, r)).not.toBe("Inky Malone");
  });
});

describe("stats", () => {
  const day = (offset: number, hour = 12) => new Date(2026, 10, 21 + offset, hour).getTime();

  function finishedOn(...offsets: number[]) {
    let state = fill(emptyGame(), offsets.length + 1); // one stays open: no kill
    offsets.forEach((o, i) => {
      state = run(state, complete(state.tasks[i].id, day(o)));
    });
    return state;
  }

  it("counts finished tasks and defeated octopuses", () => {
    let state = fill(emptyGame(), 2);
    state = run(state, complete(state.tasks[0].id), complete(state.tasks[1].id));
    expect(computeStats(state, T0)).toEqual({ killed: 1, finished: 2, streak: 1 });
  });

  it("streak counts consecutive days ending today", () => {
    expect(computeStats(finishedOn(0, -1, -2, -4), day(0)).streak).toBe(3);
  });

  it("streak still counts up to yesterday before today's first finish", () => {
    expect(computeStats(finishedOn(-1, -2), day(0, 8)).streak).toBe(2);
  });

  it("streak is broken by a missed day", () => {
    expect(computeStats(finishedOn(-2, -3), day(0)).streak).toBe(0);
  });

  it("several finishes on one day count once", () => {
    expect(computeStats(finishedOn(0, 0, 0), day(0, 23)).streak).toBe(1);
  });
});

describe("deadlines and editing", () => {
  it("stores a due date and lets an edit change just one field", () => {
    const due = T0 + 86_400_000;
    let state = apply(emptyGame(), {
      type: "addTask",
      taskId: "t-due",
      input: { title: "File taxes", description: "Form 1040", priority: 2, dueAt: due },
      at: T0,
      spawn: { id: "o-due", name: "Octo", seed: 1 },
    }).state;
    expect(state.tasks[0]).toMatchObject({ dueAt: due, description: "Form 1040" });

    state = apply(state, { type: "editTask", taskId: "t-due", patch: { priority: 3 } }).state;
    expect(state.tasks[0]).toMatchObject({ priority: 3, description: "Form 1040", dueAt: due });

    state = apply(state, { type: "editTask", taskId: "t-due", patch: { dueAt: null } }).state;
    expect(state.tasks[0].dueAt).toBeNull();
  });

  it("refuses a deadline no Date can hold", () => {
    expect(() =>
      apply(emptyGame(), {
        type: "addTask",
        taskId: "t-far",
        input: { title: "x", priority: 1, dueAt: 1e16 },
        at: T0,
        spawn: { id: "o-far", name: "Octo", seed: 1 },
      }),
    ).toThrow(RuleError);
  });

  it("defaults to no deadline", () => {
    expect(add(emptyGame(), "plain").state.tasks[0].dueAt).toBeNull();
  });
});
