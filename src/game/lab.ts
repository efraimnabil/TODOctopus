/**
 * Local-only game state for the /lab prototype.
 * Phase 2 replaces this with the real rules module + storage.
 */
import type { Octopus, Priority, Tentacle } from "./scene";

export const MAX_TENTACLES = 8;

const NAMES = [
  "Inky Malone",
  "Sir Suckalot",
  "Captain Squish",
  "Octavia",
  "Tentaculus",
  "Kraken Jr.",
  "Professor Ink",
  "Wiggles McGee",
  "Lady Eightfold",
  "Calamari Carl",
];

export const SAMPLE_TASKS: { title: string; priority: Priority }[] = [
  { title: "Reply to emails", priority: 2 },
  { title: "Gym session", priority: 1 },
  { title: "Finish the report", priority: 3 },
  { title: "Call mom", priority: 2 },
  { title: "Fix the login bug", priority: 3 },
  { title: "Buy groceries", priority: 1 },
  { title: "Read 20 pages", priority: 1 },
  { title: "Plan next sprint", priority: 2 },
];

export interface LabState {
  octopus: Octopus;
  kills: number;
  seq: number;
}

export type LabAction =
  | { type: "grow"; title: string; priority: Priority }
  | { type: "cut"; id: string; cutIndex?: number }
  | { type: "retract"; id: string }
  | { type: "retracted"; id: string }
  | { type: "dead" }
  | { type: "spawn"; seed: number };

/** Lowest slot not held by any tentacle (cut stumps keep their slot). */
export function freeSlot(octopus: Octopus): number | null {
  const used = new Set(octopus.tentacles.map((t) => t.slot));
  for (let slot = 0; slot < MAX_TENTACLES; slot++) {
    if (!used.has(slot)) return slot;
  }
  return null;
}

/** Dead when it has at least one tentacle and every remaining one is cut. */
export function isDefeated(octopus: Octopus): boolean {
  const remaining = octopus.tentacles.filter((t) => t.status !== "retracting");
  return remaining.length > 0 && remaining.every((t) => t.status === "cut");
}

function spawnOctopus(seq: number, seed: number) {
  const taskCount = 3 + (seed % 3);
  const tentacles: Tentacle[] = [];
  for (let i = 0; i < taskCount; i++) {
    const task = SAMPLE_TASKS[(seed + i * 3) % SAMPLE_TASKS.length];
    tentacles.push({ id: `t${seq++}`, slot: i, status: "alive", ...task });
  }
  const octopus: Octopus = {
    id: `o${seq++}`,
    name: NAMES[seed % NAMES.length],
    seed,
    status: "alive",
    tentacles,
  };
  return { octopus, seq };
}

export function createLabState(seed = 3): LabState {
  const { octopus, seq } = spawnOctopus(1, seed);
  return { octopus, kills: 0, seq };
}

function updateTentacle(
  state: LabState,
  id: string,
  change: (t: Tentacle) => Tentacle | null,
): LabState {
  const target = state.octopus.tentacles.find((t) => t.id === id);
  if (!target) return state;
  const next = change(target);
  if (next === target) return state;
  const tentacles = state.octopus.tentacles.flatMap((t) =>
    t.id === id ? (next ? [next] : []) : [t],
  );
  return { ...state, octopus: { ...state.octopus, tentacles } };
}

function withDeathCheck(state: LabState): LabState {
  if (state.octopus.status === "alive" && isDefeated(state.octopus)) {
    return { ...state, octopus: { ...state.octopus, status: "dying" } };
  }
  return state;
}

export function labReducer(state: LabState, action: LabAction): LabState {
  const alive = state.octopus.status === "alive";
  switch (action.type) {
    case "grow": {
      const slot = freeSlot(state.octopus);
      const title = action.title.trim();
      if (!alive || slot === null || !title) return state;
      const tentacle: Tentacle = {
        id: `t${state.seq}`,
        slot,
        title,
        priority: action.priority,
        status: "alive",
      };
      return {
        ...state,
        seq: state.seq + 1,
        octopus: {
          ...state.octopus,
          tentacles: [...state.octopus.tentacles, tentacle],
        },
      };
    }
    case "cut":
      if (!alive) return state;
      return withDeathCheck(
        updateTentacle(state, action.id, (t) =>
          t.status === "alive"
            ? { ...t, status: "cut", cutIndex: action.cutIndex }
            : t,
        ),
      );
    case "retract":
      if (!alive) return state;
      return withDeathCheck(
        updateTentacle(state, action.id, (t) =>
          t.status === "alive" ? { ...t, status: "retracting" } : t,
        ),
      );
    case "retracted":
      return updateTentacle(state, action.id, (t) =>
        t.status === "retracting" ? null : t,
      );
    case "dead":
      if (state.octopus.status !== "dying") return state;
      return {
        ...state,
        kills: state.kills + 1,
        octopus: { ...state.octopus, status: "dead" },
      };
    case "spawn": {
      if (state.octopus.status !== "dead") return state;
      const { octopus, seq } = spawnOctopus(state.seq, action.seed);
      return { ...state, octopus, seq };
    }
  }
}
