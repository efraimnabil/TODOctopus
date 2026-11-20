import * as THREE from "three";

export const RADIAL_SEGMENTS = 12;
/** Catmull-Rom rings inserted per chain segment for a smooth skin */
export const SUBDIVISIONS = 2;

export type RadiusFn = (ring: number, rings: number) => number;
export type ColorFn = (
  ring: number,
  rings: number,
  angle: number,
  out: THREE.Color,
) => void;

export function ringsFor(points: number): number {
  return (points - 1) * SUBDIVISIONS + 1;
}

/**
 * A tapered tube whose skin is rebuilt in place every frame from a chain
 * of points. Uses parallel-transport frames so the skin never twists, and
 * exposes per-ring frames so suckers/labels can be placed on it.
 *
 * Ring frame: T = tangent, S = side, U = T × S. Angle π/2 (= +U) is the
 * underside when the hint side is cross(radial, up).
 */
export class TubeBuilder {
  readonly geometry = new THREE.BufferGeometry();
  readonly maxRings: number;
  rings = 0;
  readonly centers: Float32Array;
  readonly tangents: Float32Array;
  readonly sides: Float32Array;
  readonly ups: Float32Array;
  readonly radii: Float32Array;

  private readonly positions: Float32Array;
  private readonly normals: Float32Array;
  private readonly colors: Float32Array;
  private readonly color = new THREE.Color();

  constructor(
    maxPoints: number,
    readonly radial = RADIAL_SEGMENTS,
  ) {
    this.maxRings = ringsFor(maxPoints);
    const verts = this.maxRings * (radial + 1);
    this.positions = new Float32Array(verts * 3);
    this.normals = new Float32Array(verts * 3);
    this.colors = new Float32Array(verts * 3);
    this.centers = new Float32Array(this.maxRings * 3);
    this.tangents = new Float32Array(this.maxRings * 3);
    this.sides = new Float32Array(this.maxRings * 3);
    this.ups = new Float32Array(this.maxRings * 3);
    this.radii = new Float32Array(this.maxRings);

    const index: number[] = [];
    for (let r = 0; r < this.maxRings - 1; r++) {
      for (let j = 0; j < radial; j++) {
        const a = r * (radial + 1) + j;
        const b = a + radial + 1;
        index.push(a, a + 1, b, a + 1, b + 1, b);
      }
    }
    const dyn = (arr: Float32Array) =>
      new THREE.BufferAttribute(arr, 3).setUsage(THREE.DynamicDrawUsage);
    this.geometry.setIndex(index);
    this.geometry.setAttribute("position", dyn(this.positions));
    this.geometry.setAttribute("normal", dyn(this.normals));
    this.geometry.setAttribute("color", dyn(this.colors));
    // Static UVs: u runs along the arm, v around it (for skin normal maps).
    const uvs = new Float32Array(verts * 2);
    for (let r = 0; r < this.maxRings; r++) {
      for (let j = 0; j <= radial; j++) {
        const k = (r * (radial + 1) + j) * 2;
        uvs[k] = r / (this.maxRings - 1);
        uvs[k + 1] = j / radial;
      }
    }
    this.geometry.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
    // The skin moves every frame; a generous fixed bound avoids recomputing.
    this.geometry.boundingSphere = new THREE.Sphere(
      new THREE.Vector3(0, 1, 0),
      14,
    );
    this.geometry.setDrawRange(0, 0);
  }

  update(
    points: Float32Array,
    count: number,
    sideHint: readonly [number, number, number],
    radius: RadiusFn,
    color: ColorFn,
  ): void {
    if (count < 2) {
      this.rings = 0;
      this.geometry.setDrawRange(0, 0);
      return;
    }
    const n = ringsFor(count);
    this.rings = n;
    const { centers: C, tangents: T, sides: S, ups: U } = this;

    // 1. Ring centers along a Catmull-Rom spline through the chain.
    for (let r = 0; r < n; r++) {
      let seg = Math.floor(r / SUBDIVISIONS);
      let t = (r - seg * SUBDIVISIONS) / SUBDIVISIONS;
      if (seg >= count - 1) {
        seg = count - 2;
        t = 1;
      }
      const i0 = Math.max(seg - 1, 0) * 3;
      const i1 = seg * 3;
      const i2 = (seg + 1) * 3;
      const i3 = Math.min(seg + 2, count - 1) * 3;
      const t2 = t * t;
      const t3 = t2 * t;
      for (let a = 0; a < 3; a++) {
        const p0 = points[i0 + a];
        const p1 = points[i1 + a];
        const p2 = points[i2 + a];
        const p3 = points[i3 + a];
        C[r * 3 + a] =
          0.5 *
          (2 * p1 +
            (-p0 + p2) * t +
            (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 +
            (-p0 + 3 * p1 - 3 * p2 + p3) * t3);
      }
    }

    // 2. Tangents + parallel-transported side/up frames.
    let sx = sideHint[0];
    let sy = sideHint[1];
    let sz = sideHint[2];
    let tx = 1;
    let ty = 0;
    let tz = 0;
    for (let r = 0; r < n; r++) {
      const a = Math.max(r - 1, 0) * 3;
      const b = Math.min(r + 1, n - 1) * 3;
      const dx = C[b] - C[a];
      const dy = C[b + 1] - C[a + 1];
      const dz = C[b + 2] - C[a + 2];
      const len = Math.hypot(dx, dy, dz);
      if (len > 1e-6) {
        tx = dx / len;
        ty = dy / len;
        tz = dz / len;
      }
      const dot = sx * tx + sy * ty + sz * tz;
      let nx = sx - tx * dot;
      let ny = sy - ty * dot;
      let nz = sz - tz * dot;
      let nl = Math.hypot(nx, ny, nz);
      if (nl < 1e-5) {
        // Side collapsed onto the tangent: pick any perpendicular.
        nx = -tz;
        ny = 0;
        nz = tx;
        nl = Math.hypot(nx, ny, nz) || 1;
      }
      sx = nx / nl;
      sy = ny / nl;
      sz = nz / nl;
      const k = r * 3;
      T[k] = tx;
      T[k + 1] = ty;
      T[k + 2] = tz;
      S[k] = sx;
      S[k + 1] = sy;
      S[k + 2] = sz;
      U[k] = ty * sz - tz * sy;
      U[k + 1] = tz * sx - tx * sz;
      U[k + 2] = tx * sy - ty * sx;
    }

    // 3. Skin vertices.
    const { radial, positions: P, normals: N, colors: Col } = this;
    let v = 0;
    for (let r = 0; r < n; r++) {
      const rad = radius(r, n);
      this.radii[r] = rad;
      const k = r * 3;
      for (let j = 0; j <= radial; j++) {
        const angle = (j / radial) * Math.PI * 2;
        const ca = Math.cos(angle);
        const sa = Math.sin(angle);
        const nx = ca * S[k] + sa * U[k];
        const ny = ca * S[k + 1] + sa * U[k + 1];
        const nz = ca * S[k + 2] + sa * U[k + 2];
        P[v] = C[k] + nx * rad;
        P[v + 1] = C[k + 1] + ny * rad;
        P[v + 2] = C[k + 2] + nz * rad;
        N[v] = nx;
        N[v + 1] = ny;
        N[v + 2] = nz;
        color(r, n, angle, this.color);
        Col[v] = this.color.r;
        Col[v + 1] = this.color.g;
        Col[v + 2] = this.color.b;
        v += 3;
      }
    }

    const g = this.geometry;
    g.attributes.position.needsUpdate = true;
    g.attributes.normal.needsUpdate = true;
    g.attributes.color.needsUpdate = true;
    g.setDrawRange(0, (n - 1) * radial * 6);
  }

  /** Index of the ring closest to a world point (for click-to-cut). */
  nearestRing(x: number, y: number, z: number): number {
    let best = 0;
    let bestD = Infinity;
    for (let r = 0; r < this.rings; r++) {
      const k = r * 3;
      const d =
        (this.centers[k] - x) ** 2 +
        (this.centers[k + 1] - y) ** 2 +
        (this.centers[k + 2] - z) ** 2;
      if (d < bestD) {
        bestD = d;
        best = r;
      }
    }
    return best;
  }

  dispose(): void {
    this.geometry.dispose();
  }
}

const UP = new THREE.Vector3(0, 1, 0);
const tmpPos = new THREE.Vector3();
const tmpNrm = new THREE.Vector3();
const tmpQuat = new THREE.Quaternion();
const tmpScale = new THREE.Vector3();
const tmpMat = new THREE.Matrix4();

export interface SuckerLayout {
  /** Sucker radius relative to the arm radius */
  size: number;
  /** Height relative to the sucker radius */
  height: number;
  /** Place a sucker every `step` rings */
  step: number;
  /** One staggered zig-zag row (real octopus) instead of two side-by-side rows */
  staggered: boolean;
}

export const DISC_SUCKERS: SuckerLayout = { size: 0.42, height: 0.45, step: 2, staggered: false };

/** Suckers along the underside of a tube. */
export function writeSuckers(
  mesh: THREE.InstancedMesh,
  tube: TubeBuilder,
  fromRing: number,
  toRing: number,
  layout: SuckerLayout = DISC_SUCKERS,
): void {
  let k = 0;
  const max = mesh.instanceMatrix.count;
  for (let r = fromRing; r < toRing; r += layout.step) {
    const rad = tube.radii[r];
    if (rad < 0.018) continue;
    const c = r * 3;
    const offsets = layout.staggered ? [(r / layout.step) % 2 ? 0.36 : -0.36] : [-0.42, 0.42];
    for (const offset of offsets) {
      if (k >= max) break;
      const a = Math.PI / 2 + offset;
      const ca = Math.cos(a);
      const sa = Math.sin(a);
      tmpNrm.set(
        ca * tube.sides[c] + sa * tube.ups[c],
        ca * tube.sides[c + 1] + sa * tube.ups[c + 1],
        ca * tube.sides[c + 2] + sa * tube.ups[c + 2],
      );
      tmpPos.set(tube.centers[c], tube.centers[c + 1], tube.centers[c + 2]);
      tmpPos.addScaledVector(tmpNrm, rad * 0.88);
      tmpQuat.setFromUnitVectors(UP, tmpNrm);
      const s = rad * layout.size;
      tmpScale.set(s, s * layout.height, s);
      tmpMat.compose(tmpPos, tmpQuat, tmpScale);
      mesh.setMatrixAt(k++, tmpMat);
    }
  }
  mesh.count = k;
  mesh.instanceMatrix.needsUpdate = true;
}
