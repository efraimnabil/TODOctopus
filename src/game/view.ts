import { dueLabel } from "./due";
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
/** The next (+1) or previous (-1) task in a list, wrapping; the first/last if none is selected. */
export function stepSelection(tasks: readonly Task[], selectedId: string | null, direction: 1 | -1): string | null {
  if (tasks.length === 0) return null;
  const i = tasks.findIndex((t) => t.id === selectedId);
  if (i === -1) return (direction === 1 ? tasks[0] : tasks[tasks.length - 1]).id;
  return tasks[(i + direction + tasks.length) % tasks.length].id;
}

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

export interface NextUp {
  task: Task;
  /** Why this one, in a few words ("Overdue 2d", "Due tomorrow", "High priority") */
  reason: string;
}

const SOON_MS = 2 * 24 * 60 * 60 * 1000;

/**
 * "What first?": overdue work, then anything due within two days, then high
 * priority, then the rest by priority. Ties go to the earlier deadline, then
 * the older task. Pure and free, so it works with AI off.
 */
export function nextUp(tasks: readonly Task[], now: number): NextUp | null {
  const open = tasks.filter((t) => t.status === "open");
  if (open.length === 0) return null;

  const rank = (t: Task) => {
    if (t.dueAt !== null && t.dueAt < now) return 0;
    if (t.dueAt !== null && t.dueAt - now <= SOON_MS) return 1;
    if (t.priority === 3) return 2;
    return 3;
  };
  const due = (t: Task) => t.dueAt ?? Infinity;

  const [best] = [...open].sort((a, b) => {
    const r = rank(a) - rank(b);
    if (r !== 0) return r;
    if (rank(a) <= 2 && due(a) !== due(b)) return due(a) < due(b) ? -1 : 1;
    return b.priority - a.priority || due(a) - due(b) || a.createdAt - b.createdAt;
  });

  const r = rank(best);
  const reason =
    r <= 1 ? dueLabel(best.dueAt!, now).text : r === 2 ? "High priority" : "Next in line";
  return { task: best, reason };
}
