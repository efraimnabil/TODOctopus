import { dayKey, MAX_TENTACLES } from "./rules";
import type { GameState } from "./types";

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  earned: boolean;
  /** For count-based goals: how far along you are */
  progress?: { have: number; need: number };
}

const HOUR = 60 * 60 * 1000;

/** The longest run of consecutive days with at least one slashed tentacle. */
export function longestStreak(game: GameState): number {
  const days = new Set(
    game.tasks.filter((t) => t.status === "done" && t.completedAt !== null).map((t) => dayKey(t.completedAt!)),
  );
  let best = 0;
  for (const key of days) {
    const [y, m, d] = key.split("-").map(Number);
    const prev = new Date(y, m - 1, d - 1);
    if (days.has(dayKey(prev.getTime()))) continue; // not the start of a run
    let run = 0;
    const cursor = new Date(y, m - 1, d);
    while (days.has(dayKey(cursor.getTime()))) {
      run++;
      cursor.setDate(cursor.getDate() + 1);
    }
    best = Math.max(best, run);
  }
  return best;
}

/** How many tentacles were slashed on the busiest day. */
export function bestDay(game: GameState): number {
  const per = new Map<string, number>();
  for (const t of game.tasks) {
    if (t.status === "done" && t.completedAt !== null) {
      const k = dayKey(t.completedAt);
      per.set(k, (per.get(k) ?? 0) + 1);
    }
  }
  return Math.max(0, ...per.values());
}

function counted(id: string, title: string, description: string, icon: string, have: number, need: number): Achievement {
  return { id, title, description, icon, earned: have >= need, progress: { have: Math.min(have, need), need } };
}

/** Every achievement, with whether it's earned. Pure: computed from the game. */
export function achievements(game: GameState): Achievement[] {
  const done = game.tasks.filter((t) => t.status === "done");
  const defeated = game.octopuses.filter((o) => o.status === "defeated");
  const onTime = done.filter((t) => t.dueAt !== null && t.completedAt !== null && t.completedAt <= t.dueAt);
  const quick = defeated.some((o) => o.defeatedAt !== null && o.defeatedAt - o.createdAt <= 24 * HOUR);
  const fullHouse = defeated.some(
    (o) => game.tasks.filter((t) => t.octopusId === o.id && t.status === "done").length >= MAX_TENTACLES,
  );
  const streak = longestStreak(game);

  return [
    counted("first-slash", "First blood", "Slash your first tentacle.", "🗡️", done.length, 1),
    counted("ten-slashes", "Getting the hang of it", "Slash 10 tentacles.", "✂️", done.length, 10),
    counted("fifty-slashes", "Sushi chef", "Slash 50 tentacles.", "🍣", done.length, 50),
    counted("first-defeat", "Octopus down", "Defeat your first octopus.", "🐙", defeated.length, 1),
    counted("five-defeats", "Deep sea hunter", "Defeat 5 octopuses.", "🔱", defeated.length, 5),
    counted("streak-3", "On a roll", "Slash something three days in a row.", "🔥", streak, 3),
    counted("streak-7", "Unstoppable", "Keep a seven-day streak.", "🌊", streak, 7),
    counted("busy-day", "Rampage", "Slash 5 tentacles in one day.", "⚡", bestDay(game), 5),
    counted("on-time", "Punctual", "Finish 3 tasks before their deadline.", "⏰", onTime.length, 3),
    {
      id: "speed-run",
      title: "Speed run",
      description: "Defeat an octopus within a day of it appearing.",
      icon: "🏃",
      earned: quick,
    },
    {
      id: "full-house",
      title: "Full house",
      description: "Defeat an octopus that had all eight tentacles.",
      icon: "🏠",
      earned: fullHouse,
    },
  ];
}

/** Slashes per day for the last `days` days, oldest first (for the activity chart). */
export function activity(game: GameState, now: number, days = 14): { day: number; count: number }[] {
  const counts = new Map<string, number>();
  for (const t of game.tasks) {
    if (t.status === "done" && t.completedAt !== null) {
      const k = dayKey(t.completedAt);
      counts.set(k, (counts.get(k) ?? 0) + 1);
    }
  }
  const out: { day: number; count: number }[] = [];
  const cursor = new Date(now);
  cursor.setHours(12, 0, 0, 0);
  cursor.setDate(cursor.getDate() - (days - 1));
  for (let i = 0; i < days; i++) {
    out.push({ day: cursor.getTime(), count: counts.get(dayKey(cursor.getTime())) ?? 0 });
    cursor.setDate(cursor.getDate() + 1);
  }
  return out;
}
