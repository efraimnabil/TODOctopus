/**
 * The game rules, as pure functions over plain records.
 *
 * Every change is a command, and every random choice (ids, the next
 * octopus's name and look, timestamps) travels inside the command. So the
 * same command gives the same result anywhere: in the browser for an instant
 * response, and again on the server (Phase 3) to make it official.
 */
import { z } from "zod";
import type { GameState, Octopus, Priority, Stats, Task, TaskInput } from "./types";

export const MAX_TENTACLES = 8;
export const TITLE_MAX = 80;
export const DESCRIPTION_MAX = 500;

export const priorities = [1, 2, 3] as const satisfies readonly Priority[];

const titleField = z.string().trim().min(1, "Give the task a name").max(TITLE_MAX);
const descriptionField = z.string().trim().max(DESCRIPTION_MAX);
const priorityField = z.union([z.literal(1), z.literal(2), z.literal(3)]);
const dueField = z.number().int().nonnegative().nullable();

export const taskInputSchema = z.object({
  title: titleField,
  description: descriptionField.default(""),
  priority: priorityField,
  dueAt: dueField.default(null),
});

/** Only what was sent changes (no defaults: they would overwrite the task). */
export const taskPatchSchema = z
  .object({
    title: titleField,
    description: descriptionField,
    priority: priorityField,
    dueAt: dueField,
  })
  .partial();

export const OCTOPUS_NAMES = [
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
  "Duchess Doodle",
  "Admiral Arms",
  "Squidney",
  "Count Eightula",
  "Noodle Ned",
  "Madame Mollusk",
] as const;

/** Everything a brand-new octopus needs, chosen up front. */
export interface SpawnPlan {
  id: string;
  name: string;
  seed: number;
}

export type GameCommand =
  | {
      type: "addTask";
      taskId: string;
      input: TaskInput;
      at: number;
      /** Used only when no living octopus has a free slot */
      spawn: SpawnPlan;
    }
  | { type: "editTask"; taskId: string; patch: Partial<TaskInput> }
  | { type: "completeTask"; taskId: string; at: number; cutIndex?: number | null }
  | { type: "removeTask"; taskId: string; at: number };

export type GameEvent =
  | { type: "spawned"; octopus: Octopus }
  | { type: "grew"; task: Task }
  | { type: "edited"; task: Task }
  | { type: "cut"; task: Task }
  | { type: "removed"; task: Task }
  | { type: "defeated"; octopus: Octopus };

export interface RuleResult {
  state: GameState;
  events: GameEvent[];
}

export type RuleErrorCode = "invalid-input" | "task-not-found" | "task-not-open";

export class RuleError extends Error {
  constructor(
    readonly code: RuleErrorCode,
    message: string = code,
  ) {
    super(message);
    this.name = "RuleError";
  }
}

export const emptyGame = (): GameState => ({ octopuses: [], tasks: [] });

// ── Queries ────────────────────────────────────────────────────────────────

/** An octopus's tentacles: its tasks that weren't removed, by slot. */
export function tentaclesOf(state: GameState, octopusId: string): Task[] {
  return state.tasks
    .filter((t) => t.octopusId === octopusId && t.status !== "removed")
    .sort((a, b) => a.slot - b.slot);
}

/** Lowest slot not held by an open task or a cut stump. */
export function freeSlot(state: GameState, octopusId: string): number | null {
  const used = new Set(tentaclesOf(state, octopusId).map((t) => t.slot));
  for (let slot = 0; slot < MAX_TENTACLES; slot++) {
    if (!used.has(slot)) return slot;
  }
  return null;
}

export function livingOctopuses(state: GameState): Octopus[] {
  return state.octopuses.filter((o) => o.status === "alive");
}

export function defeatedOctopuses(state: GameState): Octopus[] {
  return state.octopuses
    .filter((o) => o.status === "defeated")
    .sort((a, b) => (b.defeatedAt ?? 0) - (a.defeatedAt ?? 0));
}

/** Where the next task will grow: the oldest living octopus with room. */
export function nextHome(state: GameState): Octopus | null {
  return livingOctopuses(state).find((o) => freeSlot(state, o.id) !== null) ?? null;
}

/** Defeated once it has at least one tentacle and every one of them is cut. */
export function isDefeated(tentacles: Task[]): boolean {
  return tentacles.length > 0 && tentacles.every((t) => t.status === "done");
}

/**
 * A name for the next octopus: one no living octopus is using, if any is
 * left. `random` is in [0, 1).
 */
export function pickName(state: GameState, random: number): string {
  const taken = new Set(livingOctopuses(state).map((o) => o.name));
  const free = OCTOPUS_NAMES.filter((n) => !taken.has(n));
  const pool = free.length > 0 ? free : OCTOPUS_NAMES;
  return pool[Math.floor(random * pool.length) % pool.length];
}

// ── Commands ───────────────────────────────────────────────────────────────

export function apply(state: GameState, command: GameCommand): RuleResult {
  switch (command.type) {
    case "addTask":
      return addTask(state, command);
    case "editTask":
      return editTask(state, command.taskId, command.patch);
    case "completeTask":
      return closeTask(state, command.taskId, "done", command.at, command.cutIndex ?? null);
    case "removeTask":
      return closeTask(state, command.taskId, "removed", command.at, null);
  }
}

function parse<T>(schema: z.ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw new RuleError("invalid-input", result.error.issues[0]?.message);
  }
  return result.data;
}

function addTask(
  state: GameState,
  command: Extract<GameCommand, { type: "addTask" }>,
): RuleResult {
  const input = parse(taskInputSchema, command.input);
  const events: GameEvent[] = [];
  let octopuses = state.octopuses;
  let home = nextHome(state);
  if (!home) {
    home = {
      id: command.spawn.id,
      name: command.spawn.name,
      seed: command.spawn.seed,
      status: "alive",
      createdAt: command.at,
      defeatedAt: null,
    };
    octopuses = [...octopuses, home];
    events.push({ type: "spawned", octopus: home });
  }
  const task: Task = {
    id: command.taskId,
    octopusId: home.id,
    slot: freeSlot({ octopuses, tasks: state.tasks }, home.id) ?? 0,
    title: input.title,
    description: input.description,
    priority: input.priority,
    dueAt: input.dueAt,
    status: "open",
    createdAt: command.at,
    completedAt: null,
    cutIndex: null,
  };
  events.push({ type: "grew", task });
  return { state: { octopuses, tasks: [...state.tasks, task] }, events };
}

function findOpenTask(state: GameState, taskId: string): Task {
  const task = state.tasks.find((t) => t.id === taskId);
  if (!task) throw new RuleError("task-not-found");
  if (task.status !== "open") throw new RuleError("task-not-open");
  return task;
}

function replaceTask(state: GameState, next: Task): GameState {
  return { ...state, tasks: state.tasks.map((t) => (t.id === next.id ? next : t)) };
}

function editTask(state: GameState, taskId: string, patch: Partial<TaskInput>): RuleResult {
  const task = findOpenTask(state, taskId);
  const clean = parse(taskPatchSchema, patch);
  const next: Task = { ...task, ...clean };
  return { state: replaceTask(state, next), events: [{ type: "edited", task: next }] };
}

/** Finishing (cut) or deleting (removed) a task; either can defeat its octopus. */
function closeTask(
  state: GameState,
  taskId: string,
  status: "done" | "removed",
  at: number,
  cutIndex: number | null,
): RuleResult {
  const task = findOpenTask(state, taskId);
  const next: Task =
    status === "done"
      ? { ...task, status, completedAt: at, cutIndex }
      : { ...task, status };
  let nextState = replaceTask(state, next);
  const events: GameEvent[] = [{ type: status === "done" ? "cut" : "removed", task: next }];

  const owner = nextState.octopuses.find((o) => o.id === task.octopusId);
  if (owner?.status === "alive" && isDefeated(tentaclesOf(nextState, owner.id))) {
    const defeated: Octopus = { ...owner, status: "defeated", defeatedAt: at };
    nextState = {
      ...nextState,
      octopuses: nextState.octopuses.map((o) => (o.id === owner.id ? defeated : o)),
    };
    events.push({ type: "defeated", octopus: defeated });
  }
  return { state: nextState, events };
}

// ── Stats ──────────────────────────────────────────────────────────────────

/** Local calendar day, e.g. "2026-11-21". */
export function dayKey(ms: number): string {
  const d = new Date(ms);
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

export function computeStats(state: GameState, now: number): Stats {
  const done = state.tasks.filter((t) => t.status === "done" && t.completedAt !== null);
  const days = new Set(done.map((t) => dayKey(t.completedAt!)));

  const day = new Date(now);
  if (!days.has(dayKey(day.getTime()))) day.setDate(day.getDate() - 1);
  let streak = 0;
  while (days.has(dayKey(day.getTime()))) {
    streak++;
    day.setDate(day.getDate() - 1);
  }

  return {
    killed: state.octopuses.filter((o) => o.status === "defeated").length,
    finished: done.length,
    streak,
  };
}
