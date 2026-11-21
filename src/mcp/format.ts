import type { Octopus, Priority, Task } from "@/game/types";

export const PRIORITY_NAMES = ["low", "medium", "high"] as const;
export type PriorityName = (typeof PRIORITY_NAMES)[number];

export const priorityOf = (name: PriorityName): Priority => (PRIORITY_NAMES.indexOf(name) + 1) as Priority;
export const nameOfPriority = (p: Priority): PriorityName => PRIORITY_NAMES[p - 1];

/**
 * "2026-11-30" → the last millisecond of that day for someone at
 * `utcOffsetMinutes` (e.g. Cairo is 120 in winter). Null if it isn't a real date.
 */
export function endOfDayAt(date: string, utcOffsetMinutes = 0): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const utc = Date.UTC(y, mo - 1, d, 23, 59, 59, 999);
  const check = new Date(utc);
  if (check.getUTCMonth() !== mo - 1 || check.getUTCDate() !== d) return null;
  return utc - utcOffsetMinutes * 60_000;
}

export interface TaskView {
  id: string;
  title: string;
  priority: PriorityName;
  status: Task["status"];
  octopus: string;
  /** ISO timestamp, or null when there is no deadline */
  due: string | null;
  overdue: boolean;
}

export function taskView(t: Task, octopuses: readonly Octopus[], now: number): TaskView {
  return {
    id: t.id,
    title: t.title,
    priority: nameOfPriority(t.priority),
    status: t.status,
    octopus: octopuses.find((o) => o.id === t.octopusId)?.name ?? "?",
    due: t.dueAt === null ? null : new Date(t.dueAt).toISOString(),
    overdue: t.status === "open" && t.dueAt !== null && t.dueAt < now,
  };
}
