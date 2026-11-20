import * as THREE from "three";
import { SimplexNoise } from "three/examples/jsm/math/SimplexNoise.js";
import { mulberry32 } from "@/lib/random";
import { smoothstep, type Palette } from "./constants";
import type { Species } from "./species";
import { skinNormalMap } from "./skinDetail";

export type SkinPart = "arm" | "mantle" | "plain";

/** Wet, soft skin: clearcoat for the shine, sheen for the velvet rim. */
export function createSkinMaterial(
  palette: Palette,
  vertexColors = true,
  color?: THREE.Color,
  species?: Species,
  part: SkinPart = "plain",
) {
  const material = new THREE.MeshPhysicalMaterial({
    vertexColors,
    color: color ?? 0xffffff,
    roughness: 0.45,
    clearcoat: 0.85,
    clearcoatRoughness: 0.25,
    sheen: 0.7,
    sheenColor: palette.sheen,
    sheenRoughness: 0.45,
    emissive: new THREE.Color("#ff3fbf"),
    emissiveIntensity: 0,
  });
  const detail = species?.skinDetail;
  if (detail) {
    material.roughness = detail.roughness;
    material.clearcoat = detail.clearcoat;
    const [u, v] =
      part === "arm" ? detail.armRepeat : part === "mantle" ? detail.mantleRepeat : [2, 2];
    material.normalMap = skinNormalMap(u, v);
    material.normalScale.setScalar(detail.normalScale);
  }
  return material;
}

/** Dispose a skin material together with its own normal-map copy. */
export function disposeSkinMaterial(material: THREE.MeshPhysicalMaterial) {
  material.normalMap?.dispose();
  material.dispose();
}

export function createSuckerMaterial(palette: Palette) {
  return new THREE.MeshPhysicalMaterial({
    color: palette.sucker,
    roughness: 0.55,
    clearcoat: 0.5,
    clearcoatRoughness: 0.4,
  });
}

/**
 * Arm skin color at arc position t (0 base → 1 tip) and ring angle
 * (π/2 = underside). Shared by attached arms and severed pieces.
 */
export function armColor(
  palette: Palette,
  species: Species,
  t: number,
  angle: number,
  out: THREE.Color,
) {
  const { pattern } = species;
  out.copy(palette.skin).lerp(palette.tip, smoothstep(0.1, 1, t));
  const under = Math.sin(angle);
  const top = Math.max(0, -under);
  if (pattern.mottle > 0) {
    const m = 0.5 + 0.5 * Math.sin(t * 31 + angle * 2.3) * Math.sin(t * 11 - angle * 1.7);
    out.lerp(palette.spot, pattern.mottle * m * m * (0.4 + 0.6 * top));
  }
  if (pattern.rings && top > 0.2) {
    const band = (t * pattern.rings.count) % 1;
    if (band > 0.38 && band < 0.56 && t < 0.9) out.lerp(palette.ring, 0.85);
  }
  if (under > 0) out.lerp(palette.underside, under * under * 0.55);
}

/** Bumpy, leaning-back mantle with species spots / rings. */
export function createMantleGeometry(seed: number, species: Species, palette: Palette) {
  const { mantle, pattern } = species;
  const r = mantle.radius;
  const geo = new THREE.SphereGeometry(r, 72, 56);
  const noise = new SimplexNoise({ random: mulberry32(seed * 31 + 7) });
  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const col = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    let x = pos.getX(i);
    let y = pos.getY(i);
    let z = pos.getZ(i);
    if (y > 0) {
      y *= mantle.stretch;
      z -= mantle.lean * y * y;
    } else {
      y *= mantle.bottom;
    }
    const f = mantle.bumpFreq / r;
    const bump =
      1 +
      mantle.bumps * noise.noise3d(x * f, y * f, z * f) +
      mantle.bumps * 0.4 * noise.noise3d(x * f * 2.7, y * f * 2.7, z * f * 2.7);
    x *= bump;
    y *= bump;
    z *= bump;
    pos.setXYZ(i, x, y, z);

    const h = y / r; // height in mantle radii
    col.copy(palette.skin).lerp(palette.mantleTop, smoothstep(-0.5, 1.2, h));
    const s = pattern.spotScale / r;
    const spots = noise.noise3d(x * s + 10, y * s, z * s);
    const th = pattern.spotThreshold;
    if (h > -0.3) {
      if (pattern.rings) {
        if (spots > th && spots < th + 0.13) col.lerp(palette.ring, 0.9);
        else if (spots >= th + 0.13) col.lerp(palette.spot, pattern.spotStrength);
      } else if (spots > th) {
        col.lerp(palette.spot, Math.min(pattern.spotStrength, (spots - th) * 3));
      }
    }
    if (h < -0.4) col.lerp(palette.underside, smoothstep(-0.4, -0.85, h) * 0.45);
    colors[i * 3] = col.r;
    colors[i * 3 + 1] = col.g;
    colors[i * 3 + 2] = col.b;
  }
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  return geo;
}
