/**
 * Procedural "rest pose" for a tentacle. We walk out from the anchor,
 * bending a little at each step (integrated curvature), which gives the
 * natural curl-toward-the-tip shape. Waves travel down the arm over time.
 * The Verlet chain is then pulled toward this pose, so the arm lags,
 * drags on the floor and reacts physically instead of looking keyframed.
 */
export interface PoseParams {
  count: number;
  segment: number;
  /** Starting angle below/above horizontal, radians (negative = down) */
  pitch: number;
  /** Curl toward the tip, radians per unit length at the tip */
  curl: number;
  waveAmp: number;
  waveFreq: number;
  waveSpeed: number;
  /** Side-to-side sway, radians */
  swayAmp: number;
  phase: number;
  time: number;
}

export function createPoseParams(): PoseParams {
  return {
    count: 2,
    segment: 0.1,
    pitch: -0.6,
    curl: 1,
    waveAmp: 0.5,
    waveFreq: 1.1,
    waveSpeed: 1.4,
    swayAmp: 0.3,
    phase: 0,
    time: 0,
  };
}

/**
 * Writes `p.count` points into `out`, starting at the anchor and heading
 * along the horizontal unit direction (rx, rz).
 */
export function writePose(
  out: Float32Array,
  ax: number,
  ay: number,
  az: number,
  rx: number,
  rz: number,
  p: PoseParams,
): void {
  let x = ax;
  let y = ay;
  let z = az;
  let theta = p.pitch;
  const last = Math.max(1, p.count - 1);
  for (let i = 0; i < p.count; i++) {
    const s = i / last;
    const k = i * 3;
    out[k] = x;
    out[k + 1] = y;
    out[k + 2] = z;

    const kappa =
      p.curl * s * s * 3 +
      p.waveAmp *
        Math.sin(p.waveSpeed * p.time - p.waveFreq * s * Math.PI * 2 + p.phase) *
        (0.35 + s);
    theta += kappa * p.segment;

    const sway =
      p.swayAmp * Math.sin(p.time * 0.6 + p.phase * 1.7 + s * 2.2) * s;
    const cs = Math.cos(sway);
    const sn = Math.sin(sway);
    const dx = rx * cs + rz * sn;
    const dz = -rx * sn + rz * cs;
    const ct = Math.cos(theta);
    x += p.segment * ct * dx;
    y += p.segment * Math.sin(theta);
    z += p.segment * ct * dz;
  }
}
