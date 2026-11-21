import type { SuckerLayout } from "../geometry/tube";
import type { Tuning } from "./shared";

export interface ArmShape {
  length: number;
  baseRadius: number;
  tipRadius: number;
  /** Higher = thins out faster toward the tip */
  taper: number;
  /** Where arms attach (world y, before spawn scale) */
  anchorY: number;
  anchorRing: number;
}

export interface Species {
  id: SpeciesId;
  name: string;
  blurb: string;
  mantle: {
    radius: number;
    /** Vertical stretch of the upper half (the "bag") */
    stretch: number;
    /** How far the bag leans back */
    lean: number;
    /** Vertical squash of the lower half */
    bottom: number;
    bumps: number;
    bumpFreq: number;
    /** World y of the mantle center */
    centerY: number;
  };
  /** The head/web where arms meet, relative to the mantle center */
  skirt: { y: number; radius: number; height: number };
  eyes: {
    radius: number;
    /** Right eye; the left one is mirrored */
    position: [number, number, number];
    yaw: number;
    iris: string;
  };
  arm: ArmShape;
  colors: {
    mantleTop: string;
    skin: string;
    tip: string;
    underside: string;
    spot: string;
    sucker: string;
    sheen: string;
  };
  pattern: {
    spotThreshold: number;
    spotScale: number;
    spotStrength: number;
    /** Blotchy camouflage along the arms, 0–1 */
    mottle: number;
    rings?: { color: string; count: number };
  };
  /** Bumpy wet-skin normal map; omitted = smooth skin */
  skinDetail?: {
    normalScale: number;
    roughness: number;
    clearcoat: number;
    /** Texture repeats along/around an arm */
    armRepeat: [number, number];
    mantleRepeat: [number, number];
  };
  /** Sucker shape and layout; omitted = flat discs in two rows */
  suckers?: SuckerLayout & { cup: boolean };
  /** Skin webbing between neighbouring arms near the body */
  web?: {
    /** How far down the arms it reaches (0–1 of arm length) */
    reach: number;
    /** How deeply the free edge curves in between arms (0–1) */
    scallop: number;
  };
  tuning: Partial<Tuning>;
  /** Skin opacity (1 = solid); jellyfish are see-through */
  opacity?: number;
  /** No suckers on the arms */
  noSuckers?: boolean;
  /** Camera distance multiplier */
  view: number;
  /** Shadow size multiplier */
  footprint: number;
}

export type SpeciesId =
  | "classic"
  | "common"
  | "giant"
  | "blueRinged"
  | "realistic"
  | "jellyfish";

export const SPECIES: Record<SpeciesId, Species> = {
  classic: {
    id: "classic",
    name: "Classic",
    blurb: "The cartoon one: big round head, brand pink.",
    mantle: { radius: 0.85, stretch: 1.35, lean: 0.3, bottom: 0.85, bumps: 0.035, bumpFreq: 2.2, centerY: 1.75 },
    skirt: { y: -0.6, radius: 0.62, height: 0.3 },
    eyes: { radius: 0.19, position: [0.43, -0.4, 0.6], yaw: 0.35, iris: "#ffb020" },
    arm: { length: 3.2, baseRadius: 0.2, tipRadius: 0.012, taper: 0.85, anchorY: 1.12, anchorRing: 0.38 },
    colors: {
      mantleTop: "#a40e5c",
      skin: "#e01a80",
      tip: "#ff6a2b",
      underside: "#ffb1a3",
      spot: "#6e0a45",
      sucker: "#ffd9cc",
      sheen: "#ff7ad9",
    },
    pattern: { spotThreshold: 0.35, spotScale: 4.5, spotStrength: 0.65, mottle: 0 },
    tuning: {},
    view: 1,
    footprint: 1,
  },
  common: {
    id: "common",
    name: "Common octopus",
    blurb: "Octopus vulgaris: small leaning bag, long arms, warty red-brown skin.",
    mantle: { radius: 0.5, stretch: 1.75, lean: 0.5, bottom: 0.8, bumps: 0.07, bumpFreq: 4, centerY: 1.5 },
    skirt: { y: -0.42, radius: 0.45, height: 0.32 },
    eyes: { radius: 0.12, position: [0.3, -0.36, 0.3], yaw: 0.7, iris: "#e8c15a" },
    arm: { length: 4.2, baseRadius: 0.17, tipRadius: 0.008, taper: 1.25, anchorY: 0.92, anchorRing: 0.3 },
    colors: {
      mantleTop: "#7b2c17",
      skin: "#b0502c",
      tip: "#d4875a",
      underside: "#efc6a4",
      spot: "#3f170b",
      sucker: "#f5dcc6",
      sheen: "#ffb08a",
    },
    pattern: { spotThreshold: 0.1, spotScale: 6, spotStrength: 0.55, mottle: 0.35 },
    tuning: { curl: 1.25, pitch: -0.4, wave: 0.45, sway: 0.3 },
    view: 1.12,
    footprint: 1.2,
  },
  giant: {
    id: "giant",
    name: "Giant Pacific",
    blurb: "Huge and wrinkly, deep red, very long thick arms.",
    mantle: { radius: 0.62, stretch: 1.7, lean: 0.45, bottom: 0.8, bumps: 0.09, bumpFreq: 5.5, centerY: 1.7 },
    skirt: { y: -0.5, radius: 0.55, height: 0.34 },
    eyes: { radius: 0.13, position: [0.36, -0.44, 0.36], yaw: 0.7, iris: "#d9a441" },
    arm: { length: 5.2, baseRadius: 0.23, tipRadius: 0.01, taper: 1.15, anchorY: 1, anchorRing: 0.34 },
    colors: {
      mantleTop: "#7d1b0e",
      skin: "#b8321d",
      tip: "#e07548",
      underside: "#f1b49c",
      spot: "#4f0f08",
      sucker: "#ffd6c6",
      sheen: "#ff9a7a",
    },
    pattern: { spotThreshold: 0.2, spotScale: 5, spotStrength: 0.5, mottle: 0.45 },
    tuning: { curl: 1, pitch: -0.35, wave: 0.4, sway: 0.25 },
    view: 1.35,
    footprint: 1.45,
  },
  blueRinged: {
    id: "blueRinged",
    name: "Blue-ringed",
    blurb: "Small and golden with electric blue rings.",
    mantle: { radius: 0.52, stretch: 1.45, lean: 0.35, bottom: 0.85, bumps: 0.03, bumpFreq: 3, centerY: 1.4 },
    skirt: { y: -0.4, radius: 0.44, height: 0.3 },
    eyes: { radius: 0.12, position: [0.3, -0.32, 0.32], yaw: 0.65, iris: "#d8c070" },
    arm: { length: 3, baseRadius: 0.14, tipRadius: 0.008, taper: 1.1, anchorY: 0.9, anchorRing: 0.28 },
    colors: {
      mantleTop: "#b5863a",
      skin: "#d2a650",
      tip: "#e0c27f",
      underside: "#efdcb0",
      spot: "#5b3a14",
      sucker: "#f4e6c4",
      sheen: "#fff0b0",
    },
    pattern: {
      spotThreshold: 0.25,
      spotScale: 5,
      spotStrength: 0.7,
      mottle: 0.15,
      rings: { color: "#1f6dff", count: 7 },
    },
    tuning: { curl: 1.4, pitch: -0.5, wave: 0.6, sway: 0.35 },
    view: 0.95,
    footprint: 0.9,
  },
  realistic: {
    id: "realistic",
    name: "Realistic",
    blurb: "Modelled on real photos: webbed arms, cup suckers, wet bumpy skin.",
    mantle: { radius: 0.56, stretch: 1.55, lean: 0.55, bottom: 0.78, bumps: 0.02, bumpFreq: 2.5, centerY: 1.62 },
    skirt: { y: -0.5, radius: 0.5, height: 0.4 },
    eyes: { radius: 0.13, position: [0.37, -0.33, 0.24], yaw: 1, iris: "#d9b04a" },
    arm: { length: 5.4, baseRadius: 0.25, tipRadius: 0.006, taper: 1.7, anchorY: 0.86, anchorRing: 0.34 },
    colors: {
      mantleTop: "#b8321a",
      skin: "#de4a22",
      tip: "#f08a5a",
      underside: "#f7d6c2",
      spot: "#8a2410",
      sucker: "#fbe9dc",
      sheen: "#ffb48f",
    },
    pattern: { spotThreshold: 0.32, spotScale: 3.5, spotStrength: 0.3, mottle: 0.18 },
    skinDetail: {
      normalScale: 0.75,
      roughness: 0.3,
      clearcoat: 1,
      armRepeat: [9, 1.5],
      mantleRepeat: [3, 2],
    },
    suckers: { cup: true, size: 0.5, height: 0.55, step: 1, staggered: true },
    web: { reach: 0.3, scallop: 0.6 },
    tuning: { curl: 0.6, pitch: -0.45, wave: 0.32, sway: 0.22 },
    view: 1.4,
    footprint: 1.55,
  },
  jellyfish: {
    id: "jellyfish",
    name: "Moon jelly",
    blurb: "Not an octopus: a glowing see-through bell, long ribbon arms, no eyes.",
    mantle: { radius: 1.05, stretch: 0.55, lean: 0, bottom: 0.32, bumps: 0.012, bumpFreq: 2, centerY: 3.1 },
    skirt: { y: -0.3, radius: 0.95, height: 0.14 },
    eyes: { radius: 0.001, position: [0, 0, 0], yaw: 0, iris: "#ffffff" },
    arm: { length: 2.7, baseRadius: 0.06, tipRadius: 0.005, taper: 0.3, anchorY: 2.75, anchorRing: 0.8 },
    colors: {
      mantleTop: "#d6a8ff",
      skin: "#8fe3ff",
      tip: "#ff9be8",
      underside: "#e0f7ff",
      spot: "#ffffff",
      sucker: "#ffffff",
      sheen: "#c8f0ff",
    },
    pattern: { spotThreshold: 0.5, spotScale: 3, spotStrength: 0.25, mottle: 0 },
    opacity: 0.6,
    noSuckers: true,
    tuning: { stiffness: 0.05, curl: 0.1, wave: 1.5, sway: 0.8, pitch: -1.4, gravity: -0.15 },
    view: 1.3,
    footprint: 0.8,
  },
};

export const SPECIES_LIST: Species[] = [
  SPECIES.classic,
  SPECIES.common,
  SPECIES.giant,
  SPECIES.blueRinged,
  SPECIES.realistic,
  SPECIES.jellyfish,
];

export const DEFAULT_SPECIES: SpeciesId = "realistic";

const STORAGE_KEY = "todoctopus.species";

export function isSpeciesId(value: unknown): value is SpeciesId {
  return typeof value === "string" && value in SPECIES;
}

/** The body shape this browser picked last time, or the default. */
export function loadSpeciesChoice(): SpeciesId {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return isSpeciesId(saved) ? saved : DEFAULT_SPECIES;
  } catch {
    return DEFAULT_SPECIES;
  }
}

/** "random" gives every octopus a body of its own, picked from its seed. */
export type SpeciesChoice = SpeciesId | "random";

export function isSpeciesChoice(value: unknown): value is SpeciesChoice {
  return value === "random" || isSpeciesId(value);
}

export function resolveSpecies(choice: SpeciesChoice, seed: number): Species {
  if (choice !== "random") return SPECIES[choice];
  return SPECIES_LIST[Math.abs(Math.trunc(seed)) % SPECIES_LIST.length];
}

/** Like loadSpeciesChoice, but "random" is allowed (the game, not the lab). */
export function loadSpeciesPreference(): SpeciesChoice {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return isSpeciesChoice(saved) ? saved : DEFAULT_SPECIES;
  } catch {
    return DEFAULT_SPECIES;
  }
}

export function saveSpeciesChoice(id: SpeciesChoice): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, id);
  } catch {
    // Private mode / blocked storage: the choice just won't persist.
  }
}
