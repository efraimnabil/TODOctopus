import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { SlashSpawn } from "./FxBus";

const DURATION = 0.32;

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform float uOpacity;
  varying vec2 vUv;
  void main() {
    float x = vUv.x * 2.0 - 1.0;
    float y = vUv.y * 2.0 - 1.0;
    float body = 1.0 - x * x;
    float a = smoothstep(0.15 + 0.85 * body, 0.0, abs(y)) * body;
    vec3 col = mix(vec3(1.0, 0.15, 0.75), vec3(1.0), smoothstep(0.35, 1.0, a));
    gl_FragColor = vec4(col * a * uOpacity * 2.2, 1.0);
  }
`;

interface Props {
  spawn: SlashSpawn;
  onDone: (id: number) => void;
}

/** A bright blade streak across the tentacle at the cut point. */
export function Slash({ spawn, onDone }: Props) {
  const mesh = useRef<THREE.Mesh>(null);
  const state = useRef({ age: 0, done: false });
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: { uOpacity: { value: 1 } },
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        depthTest: false,
      }),
    [],
  );
  const tmp = useMemo(
    () => ({ a: new THREE.Vector3(), b: new THREE.Vector3() }),
    [],
  );

  useEffect(() => () => material.dispose(), [material]);

  useFrame(({ camera, size }, delta) => {
    const s = state.current;
    const m = mesh.current;
    if (!m) return;
    // Real time on purpose: the slash should play through the hit-stop.
    s.age += delta;
    const p = Math.min(1, s.age / DURATION);
    m.position.set(...spawn.position);
    m.quaternion.copy(camera.quaternion);
    tmp.a.set(...spawn.position).project(camera);
    tmp.b.set(...spawn.position).add(new THREE.Vector3(...spawn.tangent)).project(camera);
    const screenAngle = Math.atan2(
      tmp.b.y - tmp.a.y,
      (tmp.b.x - tmp.a.x) * (size.width / size.height),
    );
    m.rotateZ(screenAngle + Math.PI / 2 + 0.35);
    const grow = 1 - Math.pow(1 - Math.min(1, p * 3), 3);
    m.scale.set(1.6 * grow, 0.17 * (1 - p * 0.6), 1);
    material.uniforms.uOpacity.value = 1 - p;
    if (p >= 1 && !s.done) {
      s.done = true;
      onDone(spawn.id);
    }
  });

  return (
    <mesh ref={mesh} material={material} renderOrder={10} raycast={() => null}>
      <planeGeometry args={[1, 1]} />
    </mesh>
  );
}
