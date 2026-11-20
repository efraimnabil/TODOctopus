import * as THREE from "three";
import { mulberry32 } from "@/lib/random";

/** Fixed simulation step (seconds) */
export const STEP = 1 / 60;

export const CHAIN_POINTS = 28;
export const TENTACLE_LENGTH = 3.2;
export const SEGMENT = TENTACLE_LENGTH / (CHAIN_POINTS - 1);
export const BASE_RADIUS = 0.2;
export const TIP_RADIUS = 0.012;

/** World-space layout, floor at y = 0 */
export const MANTLE_Y = 1.75;
export const ANCHOR_Y = 1.12;
export const ANCHOR_RING = 0.38;

/** Slot → direction (degrees from the front, around Y). Fills front first. */
export const SLOT_ANGLES_DEG = [
  -22.5, 22.5, -67.5, 67.5, -112.5, 112.5, -157.5, 157.5,
];

export function radiusAt(s: number): number {
  return TIP_RADIUS + (BASE_RADIUS - TIP_RADIUS) * Math.pow(1 - s, 0.85);
}

export interface Palette {
  mantleTop: THREE.Color;
  skin: THREE.Color;
  tip: THREE.Color;
  underside: THREE.Color;
  spot: THREE.Color;
  sucker: THREE.Color;
  wound: THREE.Color;
}

/** Brand pink → orange skin, with a small hue shift per octopus. */
export function createPalette(seed: number): Palette {
  const rnd = mulberry32(seed * 9973 + 1);
  const shift = (rnd() - 0.5) * 0.08;
  const c = (hex: string) => new THREE.Color(hex).offsetHSL(shift, 0, 0);
  return {
    mantleTop: c("#a40e5c"),
    skin: c("#e01a80"),
    tip: c("#ff6a2b"),
    underside: c("#ffb1a3"),
    spot: c("#6e0a45"),
    sucker: c("#ffd9cc"),
    wound: new THREE.Color("#ff2d55"),
  };
}

export const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/** Frame-rate independent exponential approach factor */
export const damp = (rate: number, dt: number) => 1 - Math.exp(-rate * dt);
