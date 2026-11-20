import * as THREE from "three";
import { mulberry32 } from "@/lib/random";
import type { ArmShape, Species } from "./species";

/** Fixed simulation step (seconds) */
export const STEP = 1 / 60;

export const CHAIN_POINTS = 28;

/** Slot → direction (degrees from the front, around Y). Fills front first. */
export const SLOT_ANGLES_DEG = [
  -22.5, 22.5, -67.5, 67.5, -112.5, 112.5, -157.5, 157.5,
];

export function segmentLength(arm: ArmShape): number {
  return arm.length / (CHAIN_POINTS - 1);
}

export function radiusAt(s: number, arm: ArmShape): number {
  return (
    arm.tipRadius +
    (arm.baseRadius - arm.tipRadius) * Math.pow(Math.max(0, 1 - s), arm.taper)
  );
}

export interface Palette {
  mantleTop: THREE.Color;
  skin: THREE.Color;
  tip: THREE.Color;
  underside: THREE.Color;
  spot: THREE.Color;
  sucker: THREE.Color;
  wound: THREE.Color;
  ring: THREE.Color;
  sheen: THREE.Color;
}

/** Species colors with a small hue shift per individual octopus. */
export function createPalette(seed: number, species: Species): Palette {
  const rnd = mulberry32(seed * 9973 + 1);
  const shift = (rnd() - 0.5) * 0.05;
  const c = (hex: string) => new THREE.Color(hex).offsetHSL(shift, 0, 0);
  const k = species.colors;
  return {
    mantleTop: c(k.mantleTop),
    skin: c(k.skin),
    tip: c(k.tip),
    underside: c(k.underside),
    spot: c(k.spot),
    sucker: c(k.sucker),
    sheen: new THREE.Color(k.sheen),
    wound: new THREE.Color("#ff2d55"),
    ring: new THREE.Color(species.pattern.rings?.color ?? "#000000"),
  };
}

export const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/** Frame-rate independent exponential approach factor */
export const damp = (rate: number, dt: number) => 1 - Math.exp(-rate * dt);
