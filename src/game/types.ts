/**
 * The game's records. These map 1:1 to the database tables in Phase 3, so
 * keep them plain JSON (timestamps are epoch milliseconds).
 */

export type Priority = 1 | 2 | 3;

export type OctopusStatus = "alive" | "defeated";

export interface Octopus {
  id: string;
  name: string;
  /** Drives appearance variation (hue, bumps, spots) */
  seed: number;
  status: OctopusStatus;
  createdAt: number;
  defeatedAt: number | null;
}

/** open: to do · done: finished (its tentacle was cut) · removed: deleted by mistake */
export type TaskStatus = "open" | "done" | "removed";

/** A task is one tentacle of one octopus, for its whole life. */
export interface Task {
  id: string;
  octopusId: string;
  /** 0–7. Done tasks keep their slot (a stump); removed tasks free it. */
  slot: number;
  title: string;
  description: string;
  priority: Priority;
  status: TaskStatus;
  createdAt: number;
  completedAt: number | null;
  /** Where along the arm it was slashed (visual only) */
  cutIndex: number | null;
  /** When it should be done by (epoch ms); null = no deadline */
  dueAt: number | null;
}

export interface GameState {
  /** Oldest first */
  octopuses: Octopus[];
  /** Oldest first */
  tasks: Task[];
}

export interface TaskInput {
  title: string;
  description?: string;
  priority: Priority;
  dueAt?: number | null;
}

export interface Stats {
  killed: number;
  finished: number;
  /** Days in a row (ending today, or yesterday if nothing yet today) with ≥1 finished task */
  streak: number;
}

/** Who the game belongs to. Guests are real (anonymous) accounts too. */
export interface Account {
  name: string;
  email: string | null;
  isGuest: boolean;
}
