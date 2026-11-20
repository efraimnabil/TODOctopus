import type { GameState, Priority, Task } from "./types";

export type SortKey = "priority" | "due" | "newest" | "oldest";
export type PriorityFilter = Priority | "all";

export const SORT_LABELS: Record<SortKey, string> = {
  priority: "Priority",
  due: "Due soon",
  newest: "Newest",
  oldest: "Oldest",
};

/** Orders tasks for the list. Ties fall back to age so the order is stable. */
export function sortTasks(tasks: readonly Task[], key: SortKey): Task[] {
  const out = [...tasks];
  out.sort((a, b) => {
    if (key === "newest") return b.createdAt - a.createdAt;
    if (key === "oldest") return a.createdAt - b.createdAt;
    if (key === "due") {
      // Deadlines first (soonest on top), then tasks without one.
      const da = a.dueAt ?? Infinity;
      const db = b.dueAt ?? Infinity;
      if (da !== db) return da < db ? -1 : 1;
      return b.priority - a.priority || a.createdAt - b.createdAt;
    }
    return b.priority - a.priority || a.createdAt - b.createdAt;
  });
  return out;
}

export function filterTasks(tasks: readonly Task[], priority: PriorityFilter): Task[] {
  return priority === "all" ? [...tasks] : tasks.filter((t) => t.priority === priority);
}

/**
 * Which hint a newcomer should see:
 * add → nothing yet, slash → has open tasks but has never slashed one, done.
 */
export type OnboardingStep = "add" | "slash" | "done";

export function onboardingStep(game: GameState): OnboardingStep {
  if (game.tasks.some((t) => t.status === "done")) return "done";
  if (game.tasks.some((t) => t.status === "open")) return "slash";
  return game.tasks.length === 0 ? "add" : "done";
}

export interface TrophyEntry {
  octopusId: string;
  name: string;
  seed: number;
  defeatedAt: number;
  tasks: Task[];
}

/** Defeated octopuses, most recent first, with the tasks they held. */
export function trophies(game: GameState): TrophyEntry[] {
  return game.octopuses
    .filter((o) => o.status === "defeated" && o.defeatedAt !== null)
    .map((o) => ({
      octopusId: o.id,
      name: o.name,
      seed: o.seed,
      defeatedAt: o.defeatedAt as number,
      tasks: game.tasks
        .filter((t) => t.octopusId === o.id && t.status === "done")
        .sort((a, b) => (a.completedAt ?? 0) - (b.completedAt ?? 0)),
    }))
    .sort((a, b) => b.defeatedAt - a.defeatedAt);
}
