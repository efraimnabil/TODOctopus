import * as THREE from "three";
import { SimplexNoise } from "three/examples/jsm/math/SimplexNoise.js";
import { mulberry32 } from "@/lib/random";

const SIZE = 256;
let normalMap: THREE.DataTexture | null = null;

/**
 * Tileable normal map for wet octopus skin: soft wrinkles plus scattered
 * papillae (small raised bumps). Generated once in code — no asset files.
 */
export function getSkinNormalMap(): THREE.DataTexture {
  if (normalMap) return normalMap;
  const noise = new SimplexNoise({ random: mulberry32(1234) });
  const rnd = mulberry32(99);
  const h = new Float32Array(SIZE * SIZE);
  const TAU = Math.PI * 2;

  // Wrinkles: 4D noise on a torus so the texture tiles seamlessly.
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const u = (x / SIZE) * TAU;
      const v = (y / SIZE) * TAU;
      const at = (f: number) =>
        noise.noise4d(Math.cos(u) * f, Math.sin(u) * f, Math.cos(v) * f, Math.sin(v) * f);
      h[y * SIZE + x] = at(1.2) * 0.45 + at(3.5) * 0.22 + at(9) * 0.08;
    }
  }

  // Papillae: little domes, wrapped at the edges.
  for (let i = 0; i < 260; i++) {
    const cx = rnd() * SIZE;
    const cy = rnd() * SIZE;
    const r = 2 + rnd() * 5;
    const amp = 0.35 + rnd() * 0.5;
    const ri = Math.ceil(r);
    for (let dy = -ri; dy <= ri; dy++) {
      for (let dx = -ri; dx <= ri; dx++) {
        const d = Math.hypot(dx, dy) / r;
        if (d >= 1) continue;
        const x = (Math.floor(cx + dx) + SIZE) % SIZE;
        const y = (Math.floor(cy + dy) + SIZE) % SIZE;
        h[y * SIZE + x] += amp * Math.cos(d * Math.PI * 0.5) ** 2;
      }
    }
  }

  const data = new Uint8Array(SIZE * SIZE * 4);
  const strength = 2.2;
  const at = (x: number, y: number) => h[((y + SIZE) % SIZE) * SIZE + ((x + SIZE) % SIZE)];
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const dx = (at(x + 1, y) - at(x - 1, y)) * strength;
      const dy = (at(x, y + 1) - at(x, y - 1)) * strength;
      const len = Math.hypot(dx, dy, 1);
      const k = (y * SIZE + x) * 4;
      data[k] = ((-dx / len) * 0.5 + 0.5) * 255;
      data[k + 1] = ((-dy / len) * 0.5 + 0.5) * 255;
      data[k + 2] = ((1 / len) * 0.5 + 0.5) * 255;
      data[k + 3] = 255;
    }
  }

  normalMap = new THREE.DataTexture(data, SIZE, SIZE, THREE.RGBAFormat);
  normalMap.wrapS = normalMap.wrapT = THREE.RepeatWrapping;
  normalMap.magFilter = THREE.LinearFilter;
  normalMap.minFilter = THREE.LinearMipmapLinearFilter;
  normalMap.generateMipmaps = true;
  normalMap.needsUpdate = true;
  return normalMap;
}

/** A per-material copy of the shared map with its own repeat. */
export function skinNormalMap(repeatU: number, repeatV: number): THREE.Texture {
  const map = getSkinNormalMap().clone();
  map.repeat.set(repeatU, repeatV);
  map.needsUpdate = true;
  return map;
}

let cupGeometry: THREE.LatheGeometry | null = null;

/** A raised sucker with a hollow cup in the middle (unit radius, height 1). */
export function getCupSuckerGeometry(): THREE.LatheGeometry {
  if (cupGeometry) return cupGeometry;
  const profile = [
    [0, 0.42],
    [0.38, 0.45],
    [0.55, 0.62],
    [0.72, 0.95],
    [0.9, 1],
    [1, 0.7],
    [0.98, 0.25],
    [0.9, 0],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  cupGeometry = new THREE.LatheGeometry(profile, 16);
  return cupGeometry;
}
