import type { GameStore } from "@/game/store";
import { nextUp } from "@/game/view";
import { say } from "@/lib/octopusVoice";

const clip = (s: string, n = 32) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

/** Picks the tentacle to tackle first, highlights it and says why. */
export function whatFirst(store: GameStore, now = Date.now()): void {
  const s = store.getState();
  const pick = nextUp(
    s.game.tasks.filter((t) => t.octopusId === s.activeId),
    now,
  );
  if (!pick) {
    say("Nothing to tackle here. Add a task!", true);
    return;
  }
  s.select(pick.task.id);
  say(`Start with “${clip(pick.task.title)}”: ${pick.reason.toLowerCase()}.`, true);
}
