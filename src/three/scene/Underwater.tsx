import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer, Sparkles } from "@react-three/drei";
import * as THREE from "three";
import { SimplexNoise } from "three/examples/jsm/math/SimplexNoise.js";
import { mulberry32 } from "@/lib/random";

const ABYSS = "#031a2c";

/** Lights, fog, sand, caustics, light shafts, plankton, bubbles and rocks. */
export function Underwater({
  quality,
  fogDensity = 0.055,
}: {
  quality: "high" | "low";
  fogDensity?: number;
}) {
  return (
    <>
      <Atmosphere fogDensity={fogDensity} />

      <hemisphereLight args={["#8ad8ff", "#2a0f33", 0.9]} />
      <directionalLight position={[3, 9, 4]} intensity={2.2} color="#dff6ff" />
      <directionalLight position={[-5, 3, -4]} intensity={2.6} color="#ff3fd0" />
      <pointLight position={[0, 2.2, 3.4]} intensity={7} distance={9} color="#ffb48a" />

      {/* Built in-scene, so no HDR download: gives the wet skin something to reflect. */}
      <Environment resolution={64} frames={1}>
        <Lightformer form="rect" intensity={2.2} color="#9fe6ff" position={[0, 6, 0]} rotation-x={Math.PI / 2} scale={[10, 10, 1]} />
        <Lightformer form="ring" intensity={3} color="#ff3fd0" position={[-5, 2, -4]} scale={3} />
        <Lightformer form="rect" intensity={1.4} color="#ffb48a" position={[4, 1.5, 5]} scale={[4, 2, 1]} />
      </Environment>

      <Seabed />
      <Caustics />
      <GodRays />
      <Rocks />
      <Bubbles count={quality === "high" ? 36 : 14} />
      <Sparkles
        count={quality === "high" ? 160 : 60}
        scale={[14, 7, 10]}
        position={[0, 3.5, 0]}
        size={1.6}
        speed={0.25}
        opacity={0.55}
        color="#a8f0ff"
        noise={0.6}
      />
    </>
  );
}

/**
 * Background color + fog, set on the scene itself. (Declarative
 * `attach="background"` binds to the parent object, and this component sits
 * inside a <group>, so the scene used to get neither: the sky was transparent
 * and anything drawn over it, like the light shafts, showed up as black.)
 */
function Atmosphere({ fogDensity }: { fogDensity: number }) {
  const scene = useThree((s) => s.scene);
  useEffect(() => {
    const background = new THREE.Color(ABYSS);
    const fog = new THREE.FogExp2(ABYSS, fogDensity);
    scene.background = background;
    scene.fog = fog;
    return () => {
      if (scene.background === background) scene.background = null;
      if (scene.fog === fog) scene.fog = null;
    };
  }, [scene, fogDensity]);
  return null;
}

function Seabed() {
  const geometry = useMemo(() => {
    const g = new THREE.PlaneGeometry(70, 70, 140, 140);
    g.rotateX(-Math.PI / 2);
    const noise = new SimplexNoise({ random: mulberry32(42) });
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      // Flat where the octopus sits, dunes further out.
      // (wide enough for the four-octopus comparison row)
      const flat = THREE.MathUtils.smoothstep(Math.hypot(x * 0.55, z), 4, 12);
      const dunes = noise.noise(x * 0.12, z * 0.12) * 0.9 + noise.noise(x * 0.5, z * 0.5) * 0.12;
      pos.setY(i, dunes * flat);
    }
    g.computeVertexNormals();
    return g;
  }, []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <mesh geometry={geometry} raycast={() => null}>
      <meshStandardMaterial color="#123444" roughness={1} />
    </mesh>
  );
}

const causticsVertex = /* glsl */ `
  varying vec3 vWorld;
  void main() {
    vec4 w = modelMatrix * vec4(position, 1.0);
    vWorld = w.xyz;
    gl_Position = projectionMatrix * viewMatrix * w;
  }
`;

const causticsFragment = /* glsl */ `
  uniform float uTime;
  varying vec3 vWorld;
  vec2 hash2(vec2 p) {
    p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
    return fract(sin(p) * 43758.5453);
  }
  // Distance between the two nearest cell points: bright thin web = caustics.
  float cells(vec2 p, float t) {
    vec2 g = floor(p);
    vec2 f = fract(p);
    float d1 = 8.0;
    float d2 = 8.0;
    for (int y = -1; y <= 1; y++) {
      for (int x = -1; x <= 1; x++) {
        vec2 o = vec2(float(x), float(y));
        vec2 h = 0.5 + 0.5 * sin(t + 6.2831 * hash2(g + o));
        float d = length(o + h - f);
        if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) { d2 = d; }
      }
    }
    return d2 - d1;
  }
  void main() {
    vec2 p = vWorld.xz * 0.9;
    float t = uTime * 0.6;
    float c1 = 1.0 - smoothstep(0.0, 0.09, cells(p + vec2(t * 0.1, 0.0), t));
    float c2 = 1.0 - smoothstep(0.0, 0.12, cells(p * 1.35 + vec2(-t * 0.07, t * 0.05) + 3.1, t * 1.2));
    float c = pow(max(c1 * 0.6 + c2 * 0.45, 0.0), 2.0);
    // Patchy brightness so the web doesn't read as a uniform net.
    float patches = 0.35 + 0.65 * (0.5 + 0.5 * sin(vWorld.x * 0.45 + t) * sin(vWorld.z * 0.38 - t * 0.8));
    float fade = 1.0 - smoothstep(4.0, 18.0, length(vWorld.xz * vec2(0.6, 1.0)));
    gl_FragColor = vec4(vec3(0.55, 0.95, 1.0) * c * patches * 0.32 * fade, 1.0);
  }
`;

function Caustics() {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: causticsVertex,
        fragmentShader: causticsFragment,
        uniforms: { uTime: { value: 0 } },
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    [],
  );
  useEffect(() => () => material.dispose(), [material]);
  useFrame(({ clock }) => {
    material.uniforms.uTime.value = clock.elapsedTime;
  });
  return (
    <mesh rotation-x={-Math.PI / 2} position={[0, 0.006, 0]} material={material} raycast={() => null}>
      <planeGeometry args={[44, 30]} />
    </mesh>
  );
}

const rayFragment = /* glsl */ `
  uniform float uTime;
  uniform float uSeed;
  varying vec2 vUv;
  void main() {
    // pow() of a negative number is NaN on many GPUs, and float rounding at
    // the plane edges can push these inputs just below 0. NaN pixels render
    // black and bloom smears them across the screen, so clamp every input.
    float x = clamp(abs(vUv.x - 0.5) * 2.0, 0.0, 1.0);
    float y = clamp(vUv.y, 0.0, 1.0);
    float beam = pow(1.0 - x, 3.0);
    float grad = pow(y, 1.4) * smoothstep(0.0, 0.25, y);
    float flicker = 0.65 + 0.35 * sin(uTime * 0.7 + uSeed * 6.0 + y * 3.0);
    gl_FragColor = vec4(vec3(0.6, 0.9, 1.0) * beam * grad * flicker * 0.16, 1.0);
  }
`;

const rayVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const RAYS: { x: number; z: number; w: number; tilt: number }[] = [
  { x: -4.5, z: -5, w: 2.2, tilt: 0.25 },
  { x: -1.6, z: -3.5, w: 1.4, tilt: 0.18 },
  { x: 1.2, z: -4.5, w: 2.6, tilt: 0.22 },
  { x: 4, z: -3, w: 1.6, tilt: 0.3 },
  { x: -2.8, z: 1.5, w: 1.1, tilt: 0.2 },
];

function GodRays() {
  const materials = useMemo(
    () =>
      RAYS.map(
        (_, i) =>
          new THREE.ShaderMaterial({
            vertexShader: rayVertex,
            fragmentShader: rayFragment,
            uniforms: { uTime: { value: 0 }, uSeed: { value: i * 0.37 } },
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            side: THREE.DoubleSide,
            fog: false,
          }),
      ),
    [],
  );
  useEffect(() => () => materials.forEach((m) => m.dispose()), [materials]);
  useFrame(({ clock }) => {
    for (const m of materials) m.uniforms.uTime.value = clock.elapsedTime;
  });
  return (
    <>
      {RAYS.map((r, i) => (
        <mesh
          key={i}
          position={[r.x, 5.5, r.z]}
          rotation={[0, 0, r.tilt]}
          material={materials[i]}
          raycast={() => null}
        >
          <planeGeometry args={[r.w, 12]} />
        </mesh>
      ))}
    </>
  );
}

const ROCKS: { p: [number, number, number]; s: [number, number, number] }[] = [
  { p: [-3.8, 0, -2.6], s: [1.3, 0.9, 1.1] },
  { p: [-2.6, 0, -3.6], s: [0.7, 0.5, 0.6] },
  { p: [4.2, 0, -3.2], s: [1.6, 1.1, 1.2] },
  { p: [3, 0, -4.6], s: [0.8, 0.6, 0.7] },
  { p: [-5.5, 0, 0.8], s: [0.6, 0.4, 0.5] },
  { p: [5.2, 0, 1.2], s: [0.5, 0.35, 0.5] },
];

function Rocks() {
  const geometry = useMemo(() => {
    const g = new THREE.IcosahedronGeometry(1, 2);
    const noise = new SimplexNoise({ random: mulberry32(9) });
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const v = new THREE.Vector3().fromBufferAttribute(pos, i);
      v.multiplyScalar(1 + noise.noise3d(v.x * 1.6, v.y * 1.6, v.z * 1.6) * 0.22);
      pos.setXYZ(i, v.x, v.y, v.z);
    }
    g.computeVertexNormals();
    return g;
  }, []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <>
      {ROCKS.map((r, i) => (
        <mesh key={i} geometry={geometry} position={r.p} scale={r.s} raycast={() => null}>
          <meshStandardMaterial color={i % 2 ? "#1b2c4a" : "#16384a"} roughness={0.95} flatShading />
        </mesh>
      ))}
    </>
  );
}

function Bubbles({ count }: { count: number }) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const bubbles = useMemo(() => {
    const rnd = mulberry32(5);
    const vents: [number, number][] = [[-3.6, -2.4], [4, -3], [-1.4, -4]];
    return Array.from({ length: count }, (_, i) => {
      const [vx, vz] = vents[i % vents.length];
      return {
        x: vx + (rnd() - 0.5) * 0.6,
        z: vz + (rnd() - 0.5) * 0.6,
        y: rnd() * 9,
        speed: 0.5 + rnd() * 0.8,
        size: 0.025 + rnd() * 0.05,
        phase: rnd() * 10,
      };
    });
  }, [count]);
  const tmp = useMemo(() => new THREE.Object3D(), []);
  useFrame(({ clock }, delta) => {
    const m = mesh.current;
    if (!m) return;
    const t = clock.elapsedTime;
    bubbles.forEach((b, i) => {
      b.y += b.speed * Math.min(delta, 1 / 20);
      if (b.y > 9) b.y = 0;
      tmp.position.set(b.x + Math.sin(t * 2 + b.phase) * 0.08, b.y, b.z);
      tmp.scale.setScalar(b.size * (1 + b.y * 0.04));
      tmp.updateMatrix();
      m.setMatrixAt(i, tmp.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]} frustumCulled={false} raycast={() => null}>
      <sphereGeometry args={[1, 12, 8]} />
      <meshStandardMaterial color="#dff8ff" emissive="#7fd8ff" emissiveIntensity={0.4} transparent opacity={0.45} roughness={0.1} />
    </instancedMesh>
  );
}
