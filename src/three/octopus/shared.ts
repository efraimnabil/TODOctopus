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

/**
 * Which arm the pointer is "on". Hover is sticky: it starts when the pointer
 * touches an arm and ends only once the pointer is clearly away from that
 * arm on screen. (Arms lift when hovered, which would otherwise move them out
 * from under the cursor and make them bob up and down forever.)
 */
export interface HoverState {
  owner: string | null;
  /** Slashes the hovered arm at the point nearest the pointer */
  cut: (() => void) | null;
}

export function createHoverState(): HoverState {
  return { owner: null, cut: null };
}
