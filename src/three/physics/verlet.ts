/**
 * Minimal Verlet rope: a chain of points joined by fixed-length segments.
 * Positions are packed xyz in Float32Arrays so we can hand them straight
 * to geometry builders without allocating.
 */
export interface Chain {
  /** Points currently simulated (≤ capacity). Lets a cut tentacle shrink. */
  count: number;
  readonly capacity: number;
  readonly pos: Float32Array;
  readonly prev: Float32Array;
  /** Rest length of every segment */
  rest: number;
}

export function createChain(capacity: number, rest: number): Chain {
  return {
    count: capacity,
    capacity,
    pos: new Float32Array(capacity * 3),
    prev: new Float32Array(capacity * 3),
    rest,
  };
}

/** Move points by their velocity (pos - prev) plus gravity. */
export function integrate(
  c: Chain,
  dt: number,
  gravityY: number,
  drag: number,
  from = 0,
): void {
  const g = gravityY * dt * dt;
  for (let i = from; i < c.count; i++) {
    const k = i * 3;
    for (let a = 0; a < 3; a++) {
      const p = c.pos[k + a];
      const v = (p - c.prev[k + a]) * drag;
      c.prev[k + a] = p;
      c.pos[k + a] = p + v + (a === 1 ? g : 0);
    }
  }
}

/** Pull points a fraction `k` of the way toward a target pose. */
export function attract(
  c: Chain,
  target: Float32Array,
  k: number,
  from = 0,
): void {
  for (let i = from * 3; i < c.count * 3; i++) {
    c.pos[i] += (target[i] - c.pos[i]) * k;
  }
}

/** Hard-set a point with zero velocity. */
export function pinPoint(c: Chain, i: number, x: number, y: number, z: number) {
  const k = i * 3;
  c.pos[k] = c.prev[k] = x;
  c.pos[k + 1] = c.prev[k + 1] = y;
  c.pos[k + 2] = c.prev[k + 2] = z;
}

/** Enforce segment lengths. The first `pinned` points never move. */
export function solveDistances(c: Chain, iterations: number, pinned: number) {
  const { pos, rest } = c;
  for (let it = 0; it < iterations; it++) {
    for (let i = 0; i < c.count - 1; i++) {
      const wa = i < pinned ? 0 : 1;
      const wb = i + 1 < pinned ? 0 : 1;
      const sum = wa + wb;
      if (sum === 0) continue;
      const a = i * 3;
      const b = a + 3;
      const dx = pos[b] - pos[a];
      const dy = pos[b + 1] - pos[a + 1];
      const dz = pos[b + 2] - pos[a + 2];
      const d = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (d < 1e-6) continue;
      const diff = (d - rest) / d;
      const fa = (diff * wa) / sum;
      const fb = (diff * wb) / sum;
      pos[a] += dx * fa;
      pos[a + 1] += dy * fa;
      pos[a + 2] += dz * fa;
      pos[b] -= dx * fb;
      pos[b + 1] -= dy * fb;
      pos[b + 2] -= dz * fb;
    }
  }
}

/** Keep points above the floor, sliding with some friction. */
export function collideFloor(
  c: Chain,
  floorY: number,
  radiusOf: (i: number) => number,
  friction: number,
) {
  for (let i = 0; i < c.count; i++) {
    const k = i * 3;
    const minY = floorY + radiusOf(i);
    if (c.pos[k + 1] < minY) {
      c.pos[k + 1] = minY;
      c.prev[k + 1] = minY;
      c.prev[k] = c.pos[k] - (c.pos[k] - c.prev[k]) * (1 - friction);
      c.prev[k + 2] = c.pos[k + 2] - (c.pos[k + 2] - c.prev[k + 2]) * (1 - friction);
    }
  }
}

/** Largest relative deviation from rest length (for tests/debug). */
export function maxSegmentError(c: Chain): number {
  let worst = 0;
  for (let i = 0; i < c.count - 1; i++) {
    const a = i * 3;
    const b = a + 3;
    const d = Math.hypot(
      c.pos[b] - c.pos[a],
      c.pos[b + 1] - c.pos[a + 1],
      c.pos[b + 2] - c.pos[a + 2],
    );
    worst = Math.max(worst, Math.abs(d - c.rest) / c.rest);
  }
  return worst;
}
