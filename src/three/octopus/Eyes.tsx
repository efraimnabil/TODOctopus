import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { FxBus } from "../fx/FxBus";
import { damp } from "./constants";
import type { OctoState } from "./shared";

const EYE_R = 0.19;
/** Relative to the mantle center */
const EYE_POSITIONS: [number, number, number][] = [
  [-0.43, -0.4, 0.6],
  [0.43, -0.4, 0.6],
];
const LID_OPEN = -1.15;
const LID_CLOSED = 1.5;

interface Props {
  octo: OctoState;
  fx: FxBus;
  lidMaterial: THREE.Material;
  whiteMaterial: THREE.Material;
  irisMaterial: THREE.Material;
  pupilMaterial: THREE.Material;
}

/**
 * Eyeballs follow the pointer, blink at random, squint when hurt and
 * close for good when the octopus dies. Octopus pupils are horizontal slits.
 */
export function Eyes({
  octo,
  fx,
  lidMaterial,
  whiteMaterial,
  irisMaterial,
  pupilMaterial,
}: Props) {
  const balls = useRef<(THREE.Group | null)[]>([]);
  const lids = useRef<(THREE.Mesh | null)[]>([]);
  const blink = useRef({ t: 0, next: 2.2, close: 0, seed: 0.37 });
  const tmp = useMemo(
    () => ({ eye: new THREE.Vector3(), target: new THREE.Vector3() }),
    [],
  );
  const sphere = useMemo(() => new THREE.SphereGeometry(1, 32, 24), []);
  const lidGeo = useMemo(
    () =>
      new THREE.SphereGeometry(EYE_R * 1.1, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2),
    [],
  );

  useFrame((state, delta) => {
    const dt = Math.min(delta, 1 / 20);
    const b = blink.current;
    // Blink timing uses real time so a slow frame can't hold the eyes shut.
    b.next -= delta;
    let blinking = 0;
    if (b.next < 0) {
      blinking = 1;
      b.t += delta;
      if (b.t > 0.13) {
        b.t = 0;
        // Cheap deterministic jitter so blinks don't feel metronomic.
        b.seed = (b.seed * 9.73 + 0.31) % 1;
        b.next = 1.6 + b.seed * 3.6;
      }
    }
    const close = Math.max(blinking, fx.hurt * 0.75, octo.death);
    b.close += (close - b.close) * damp(blinking ? 40 : 14, dt);

    tmp.target.set(state.pointer.x * 4.5, 1.4 + state.pointer.y * 2.4, 5);
    balls.current.forEach((ball, i) => {
      if (!ball) return;
      ball.getWorldPosition(tmp.eye);
      const dx = tmp.target.x - tmp.eye.x;
      const dy = tmp.target.y - tmp.eye.y;
      const dz = tmp.target.z - tmp.eye.z;
      const baseYaw = i === 0 ? -0.35 : 0.35;
      const yaw = THREE.MathUtils.clamp(Math.atan2(dx, dz) - baseYaw, -0.6, 0.6);
      const pitch = THREE.MathUtils.clamp(
        -Math.atan2(dy, Math.hypot(dx, dz)),
        -0.45,
        0.45,
      );
      ball.rotation.x += (pitch - ball.rotation.x) * damp(10, dt);
      ball.rotation.y += (yaw - ball.rotation.y) * damp(10, dt);
      const lid = lids.current[i];
      if (lid) lid.rotation.x = LID_OPEN + (LID_CLOSED - LID_OPEN) * b.close;
    });
  });

  return (
    <>
      {EYE_POSITIONS.map((p, i) => (
        <group key={i} position={p} rotation={[0, i === 0 ? -0.35 : 0.35, 0]}>
          <group
            ref={(el) => {
              balls.current[i] = el;
            }}
          >
            <mesh geometry={sphere} material={whiteMaterial} scale={EYE_R} />
            <mesh
              geometry={sphere}
              material={irisMaterial}
              position={[0, 0, EYE_R * 0.8]}
              scale={[EYE_R * 0.62, EYE_R * 0.62, EYE_R * 0.25]}
            />
            <mesh
              geometry={sphere}
              material={pupilMaterial}
              position={[0, 0, EYE_R * 0.98]}
              scale={[EYE_R * 0.42, EYE_R * 0.14, EYE_R * 0.1]}
            />
          </group>
          <mesh
            ref={(el) => {
              lids.current[i] = el;
            }}
            geometry={lidGeo}
            material={lidMaterial}
          />
        </group>
      ))}
    </>
  );
}
