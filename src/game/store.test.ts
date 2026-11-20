import { describe, expect, it } from "vitest";
import { MemoryRepository } from "./repository";
import { createGameStore, onStage, toScene, type GameDeps } from "./store";

function setup() {
  let n = 0;
  const deps: GameDeps = { now: () => 1_000 + n, random: () => 0.5, id: () => `id${++n}` };
  const repo = new MemoryRepository();
  const store = createGameStore(repo, deps);
  return { store, repo, get: store.getState };
}

const flush = () => new Promise((r) => setTimeout(r, 0));

describe("game store", () => {
  it("adding the first task spawns an octopus and puts it on stage", async () => {
    const { get, repo } = setup();
    await get().load();
    expect(get().activeId).toBeNull();
    expect(get().addTask({ title: "Call mom", priority: 2 })).toBe(true);
    const [octopus] = get().game.octopuses;
    expect(get().activeId).toBe(octopus.id);
    await flush();
    expect(repo.commands.map((c) => c.type)).toEqual(["addTask"]);
  });

  it("reports invalid input without changing anything", async () => {
    const { get, repo } = setup();
    await get().load();
    expect(get().addTask({ title: "  ", priority: 2 })).toBe(false);
    expect(get().error).toBeTruthy();
    expect(get().game.tasks).toHaveLength(0);
    await flush();
    expect(repo.commands).toHaveLength(0);
  });

  it("a deleted task retracts in the scene, then disappears", async () => {
    const { get } = setup();
    await get().load();
    get().addTask({ title: "a", priority: 1 });
    get().addTask({ title: "b", priority: 1 });
    const id = get().game.tasks[0].id;
    get().removeTask(id);
    const octo = get().activeId!;
    expect(toScene(get(), octo)!.tentacles.find((t) => t.id === id)?.status).toBe("retracting");
    get().retracted(id);
    expect(toScene(get(), octo)!.tentacles.find((t) => t.id === id)).toBeUndefined();
  });

  it("the last cut plays the death, then shows the defeated card", async () => {
    const { get } = setup();
    await get().load();
    get().addTask({ title: "a", priority: 1 });
    const octo = get().activeId!;
    get().completeTask(get().game.tasks[0].id, 9);
    expect(toScene(get(), octo)!.status).toBe("dying");
    expect(toScene(get(), octo)!.tentacles[0]).toMatchObject({ status: "cut", cutIndex: 9 });
    expect(onStage(get()).map((o) => o.id)).toEqual([octo]);
    get().deathFinished(octo);
    expect(get().defeatedCard).toBe(octo);
    expect(toScene(get(), octo)!.status).toBe("dead");
    get().dismissDefeat();
    expect(get().activeId).toBeNull();
    expect(onStage(get())).toHaveLength(0);
  });

  it("selecting a task on another octopus switches the stage to it", async () => {
    const { get } = setup();
    await get().load();
    for (let i = 0; i < 9; i++) get().addTask({ title: `t${i}`, priority: 1 });
    const [first, second] = get().game.octopuses;
    expect(get().activeId).toBe(second.id);
    get().select(get().game.tasks[0].id);
    expect(get().activeId).toBe(first.id);
    get().step(1);
    expect(get().activeId).toBe(second.id);
    get().step(1);
    expect(get().activeId).toBe(first.id);
  });

  it("keeps the game across loads", async () => {
    const { get, repo } = setup();
    await get().load();
    get().addTask({ title: "a", priority: 3 });
    await flush();
    const again = createGameStore(repo);
    await again.getState().load();
    expect(again.getState().game.tasks[0].title).toBe("a");
    expect(again.getState().activeId).toBe(get().activeId);
  });

  it("rolls back a change the server didn't save", async () => {
    const { get, repo } = setup();
    await get().load();
    get().addTask({ title: "kept", priority: 1 });
    await flush();
    repo.failNext = true;
    get().addTask({ title: "lost", priority: 1 });
    expect(get().game.tasks).toHaveLength(2);
    expect(get().pending).toBe(1);
    await flush();
    await flush();
    expect(get().error).toMatch(/undone/);
    expect(get().pending).toBe(0);
    expect(get().game.tasks.map((t) => t.title)).toEqual(["kept"]);
  });

  it("the first saved change makes the newcomer a guest", async () => {
    const { get } = setup();
    await get().load();
    expect(get().account).toBeNull();
    get().addTask({ title: "a", priority: 1 });
    await flush();
    expect(get().account).toMatchObject({ isGuest: true });
  });
});
