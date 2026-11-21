import type { Task } from "./types";

const DAY = 24 * 60 * 60 * 1000;

/** "2026-11-21" (from a date input) → the end of that day in local time. */
export function endOfDay(dateInput: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateInput);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 23, 59, 59, 999);
  return Number.isNaN(d.getTime()) ? null : d.getTime();
}

/** Epoch ms → "2026-11-21" for a date input (local time). */
export function toDateInput(ms: number | null): string {
  if (ms === null) return "";
  const d = new Date(ms);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function isOverdue(task: Pick<Task, "status" | "dueAt">, now: number): boolean {
  return task.status === "open" && task.dueAt !== null && task.dueAt < now;
}

export type DueTone = "overdue" | "soon" | "later";

/** Short text for a deadline: "Overdue 2d", "Due today", "Due tomorrow", "Due in 5d". */
const startOfDay = (ms: number) => {
  const d = new Date(ms);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
};

/** Whole calendar days from `now` to `ms` (negative = in the past). */
const dayDiff = (ms: number, now: number) => Math.round((startOfDay(ms) - startOfDay(now)) / DAY);

/** Short text for a deadline: "Overdue 2d", "Due today", "Due tomorrow", "Due in 5d". */
export function dueLabel(dueAt: number, now: number): { text: string; tone: DueTone } {
  const days = dayDiff(dueAt, now);
  if (dueAt < now) {
    const late = Math.max(1, -days);
    return { text: late > 365 ? "Overdue 1y+" : `Overdue ${late}d`, tone: "overdue" };
  }
  if (days <= 0) return { text: "Due today", tone: "soon" };
  if (days === 1) return { text: "Due tomorrow", tone: "soon" };
  if (days > 60) {
    const sameYear = new Date(dueAt).getFullYear() === new Date(now).getFullYear();
    const on = new Date(dueAt).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: sameYear ? undefined : "numeric",
    });
    return { text: `Due ${on}`, tone: "later" };
  }
  return { text: `Due in ${days}d`, tone: days <= 3 ? "soon" : "later" };
}
