/**
 * What the 3D scene draws. This is a view of the game state (see ./types),
 * plus the in-between animation states the game itself doesn't have.
 */
import type { Priority } from "./types";

export type { Priority };

/** alive: still a task to do · cut: task finished · retracting: task deleted */
export type TentacleStatus = "alive" | "cut" | "retracting";

export interface Tentacle {
  id: string;
  /** 0–7, fixed for the tentacle's whole life */
  slot: number;
  title: string;
  priority: Priority;
  status: TentacleStatus;
  /** Chain point where the tentacle was slashed (visual only) */
  cutIndex?: number;
}

export type OctopusStatus = "alive" | "dying" | "dead";

export interface Octopus {
  id: string;
  name: string;
  /** Drives appearance variation (hue, bumps, spots) */
  seed: number;
  status: OctopusStatus;
  tentacles: Tentacle[];
}
