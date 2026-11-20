import * as THREE from "three";
import { SimplexNoise } from "three/examples/jsm/math/SimplexNoise.js";
import { mulberry32 } from "@/lib/random";
import { smoothstep, type Palette } from "./constants";

/** Wet, soft skin: clearcoat for the shine, sheen for the velvet rim. */
export function createSkinMaterial(vertexColors = true, color?: THREE.Color) {
  return new THREE.MeshPhysicalMaterial({
    vertexColors,
    color: color ?? 0xffffff,
    roughness: 0.42,
    clearcoat: 0.9,
    clearcoatRoughness: 0.22,
    sheen: 0.8,
    sheenColor: new THREE.Color("#ff7ad9"),
    sheenRoughness: 0.45,
    emissive: new THREE.Color("#ff3fbf"),
    emissiveIntensity: 0,
  });
}

export function createSuckerMaterial(palette: Palette) {
  return new THREE.MeshPhysicalMaterial({
    color: palette.sucker,
    roughness: 0.55,
    clearcoat: 0.5,
    clearcoatRoughness: 0.4,
  });
}

/** Bumpy, leaning-back mantle with darker spots on top. */
export function createMantleGeometry(seed: number, palette: Palette) {
  const geo = new THREE.SphereGeometry(0.85, 72, 56);
  const noise = new SimplexNoise({ random: mulberry32(seed * 31 + 7) });
  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const col = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    let x = pos.getX(i);
    let y = pos.getY(i);
    let z = pos.getZ(i);
    if (y > 0) {
      y *= 1.35;
      z -= 0.3 * y * y;
    } else {
      y *= 0.85;
    }
    const bump = 1 + 0.035 * noise.noise3d(x * 2.2, y * 2.2, z * 2.2);
    x *= bump;
    y *= bump;
    z *= bump;
    pos.setXYZ(i, x, y, z);

    col.copy(palette.skin).lerp(palette.mantleTop, smoothstep(-0.5, 1.1, y));
    const spots = noise.noise3d(x * 4.5 + 10, y * 4.5, z * 4.5);
    if (spots > 0.35 && y > -0.2) col.lerp(palette.spot, Math.min(0.65, (spots - 0.35) * 3));
    if (y < -0.35) col.lerp(palette.underside, smoothstep(-0.35, -0.75, y) * 0.45);
    colors[i * 3] = col.r;
    colors[i * 3 + 1] = col.g;
    colors[i * 3 + 2] = col.b;
  }
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  return geo;
}
