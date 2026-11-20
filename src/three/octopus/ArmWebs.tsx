import { useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { TubeBuilder } from "../geometry/tube";
import { SLOT_ANGLES_DEG } from "./constants";
import type { Species } from "./species";

/** Slots in order around the body, so neighbours share a web. */
const RING_ORDER = SLOT_ANGLES_DEG.map((deg, slot) => ({ deg, slot }))
  .sort((a, b) => a.deg - b.deg)
  .map((s) => s.slot);

const ROWS = 12; // along the arms
const COLS = 8; // across from one arm to the next
const PAIRS = RING_ORDER.length;
const VERTS_PER_WEB = (ROWS + 1) * (COLS + 1);
const HIDDEN_Y = -50;

interface Props {
  tubes: Map<number, TubeBuilder>;
  web: NonNullable<Species["web"]>;
  material: THREE.Material;
}

/**
 * The skin membrane between neighbouring arms near the body (the
 * "interbrachial web"). Rebuilt each frame from the arms' current skin
 * frames, so it stretches and folds as the arms move. The free edge is
 * scalloped: it reaches furthest along each arm and dips in between.
 */
export function ArmWebs({ tubes, web, material }: Props) {
  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const positions = new Float32Array(PAIRS * VERTS_PER_WEB * 3);
    const index: number[] = [];
    for (let p = 0; p < PAIRS; p++) {
      const base = p * VERTS_PER_WEB;
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const a = base + r * (COLS + 1) + c;
          const b = a + COLS + 1;
          index.push(a, b, a + 1, a + 1, b, b + 1);
        }
      }
    }
    g.setIndex(index);
    g.setAttribute(
      "position",
      new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage),
    );
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 1, 0), 14);
    return g;
  }, []);
  useEffect(() => () => geometry.dispose(), [geometry]);

  const tmp = useMemo(
    () => ({ a: new THREE.Vector3(), b: new THREE.Vector3(), towardB: new THREE.Vector3() }),
    [],
  );

  useFrame(() => {
    const pos = geometry.attributes.position.array as Float32Array;
    for (let p = 0; p < PAIRS; p++) {
      const A = tubes.get(RING_ORDER[p]);
      const B = tubes.get(RING_ORDER[(p + 1) % PAIRS]);
      const base = p * VERTS_PER_WEB * 3;
      if (!A || !B || A.rings < 4 || B.rings < 4) {
        // Missing neighbour: collapse this web out of sight.
        for (let i = 0; i < VERTS_PER_WEB; i++) pos[base + i * 3 + 1] = HIDDEN_Y;
        continue;
      }
      const reach = Math.min(
        web.reach * (A.maxRings - 1),
        A.rings - 2,
        B.rings - 2,
      );
      // Which side of each arm faces its neighbour.
      tmp.towardB.set(B.centers[0] - A.centers[0], 0, B.centers[2] - A.centers[2]);
      const signA = Math.sign(tmp.towardB.x * A.sides[0] + tmp.towardB.z * A.sides[2]) || 1;
      const signB = -(Math.sign(tmp.towardB.x * B.sides[0] + tmp.towardB.z * B.sides[2]) || 1);

      for (let r = 0; r <= ROWS; r++) {
        for (let c = 0; c <= COLS; c++) {
          const across = c / COLS;
          const scallop = 1 - web.scallop * Math.sin(Math.PI * across);
          const ring = (r / ROWS) * reach * scallop;
          sideEdge(A, ring, signA, tmp.a);
          sideEdge(B, ring, signB, tmp.b);
          tmp.a.lerp(tmp.b, across);
          const k = base + (r * (COLS + 1) + c) * 3;
          pos[k] = tmp.a.x;
          pos[k + 1] = tmp.a.y;
          pos[k + 2] = tmp.a.z;
        }
      }
    }
    geometry.attributes.position.needsUpdate = true;
    geometry.computeVertexNormals();
  });

  return (
    <mesh geometry={geometry} material={material} frustumCulled={false} raycast={() => null} />
  );
}

/** Point on an arm's skin at fractional ring `x`, on the side `sign`·S. */
function sideEdge(t: TubeBuilder, x: number, sign: number, out: THREE.Vector3) {
  const i = Math.min(Math.floor(x), t.rings - 2);
  const f = x - i;
  const a = i * 3;
  const b = a + 3;
  const lerp = (arr: Float32Array, k: number) => arr[a + k] + (arr[b + k] - arr[a + k]) * f;
  const rad = (t.radii[i] + (t.radii[i + 1] - t.radii[i]) * f) * 0.85;
  // Slightly toward the underside so the web sits low between the arms.
  out.set(
    lerp(t.centers, 0) + (lerp(t.sides, 0) * sign + lerp(t.ups, 0) * 0.25) * rad,
    lerp(t.centers, 1) + (lerp(t.sides, 1) * sign + lerp(t.ups, 1) * 0.25) * rad,
    lerp(t.centers, 2) + (lerp(t.sides, 2) * sign + lerp(t.ups, 2) * 0.25) * rad,
  );
}
