"use client";

import { track } from "@vercel/analytics";
import type { GameEvent } from "@/game/rules";

/**
 * The only things we count, and never anything a person typed: no task
 * titles, no emails, no names. Counting is what lets a launch teach us
 * something (do people add a task? slash one? share it?).
 */
export type AnalyticsEvent =
  | "task_added"
  | "task_slashed"
  | "octopus_defeated"
  | "share_clicked"
  | "signed_up"
  | "token_created"
  | "ai_used";

export function count(event: AnalyticsEvent, props?: Record<string, string>): void {
  try {
    track(event, props);
  } catch {
    // Analytics must never break the game (blocked scripts, ad blockers).
  }
}

const FROM_GAME: Partial<Record<GameEvent["type"], AnalyticsEvent>> = {
  grew: "task_added",
  cut: "task_slashed",
  defeated: "octopus_defeated",
};

/** Counts what happened in the game. Only the kind of event is recorded. */
export function countGameEvents(events: readonly GameEvent[]): void {
  for (const e of events) {
    const name = FROM_GAME[e.type];
    if (name) count(name);
  }
}
