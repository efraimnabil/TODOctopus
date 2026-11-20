export type Priority = 1 | 2 | 3;

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
