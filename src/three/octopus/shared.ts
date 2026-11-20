import type { RefObject } from "react";

/** Per-octopus values the rig writes every frame and the parts read. */
export interface OctoState {
  /** Vertical offset of the whole body (bobbing, floating away on death) */
  offsetY: number;
  /** Spawn scale 0 → 1 */
  scale: number;
  /** Fades out on death */
  opacity: number;
  /** 0 → 1 during the first part of the death animation */
  death: number;
}

/** Live-tweakable motion settings (Leva panel in the lab). */
export interface Tuning {
  stiffness: number;
  curl: number;
  wave: number;
  sway: number;
  pitch: number;
  gravity: number;
}

export const DEFAULT_TUNING: Tuning = {
  stiffness: 0.12,
  curl: 0.9,
  wave: 0.55,
  sway: 0.35,
  pitch: -0.6,
  gravity: -1.2,
};

export type TuningRef = RefObject<Tuning>;
