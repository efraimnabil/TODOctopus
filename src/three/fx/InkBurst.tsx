import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { mulberry32 } from "@/lib/random";
import type { FxBus, InkSpawn } from "./FxBus";

const PUFFS = 28;
const LIFETIME = 2.2;

let puffTexture: THREE.Texture | null = null;
/** Soft round alpha blob, shared by every ink puff. */
function getPuffTexture() {
  if (puffTexture) return puffTexture;
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.4, "rgba(255,255,255,0.6)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  puffTexture = new THREE.CanvasTexture(canvas);
  return puffTexture;
}

interface Props {
  spawn: InkSpawn;
  fx: FxBus;
  onDone: (id: number) => void;
}

/** A cloud of soft ink puffs that billow out, grow and dissolve. */
export function InkBurst({ spawn, fx, onDone }: Props) {
  const group = useRef<THREE.Group>(null);
  const puffs = useMemo(() => {
    const rnd = mulberry32(spawn.id * 7919);
    return Array.from({ length: PUFFS }, () => ({
      dir: new THREE.Vector3(rnd() - 0.5, rnd() * 0.8 - 0.2, rnd() - 0.5).normalize(),
      speed: 0.5 + rnd() * 1.1,
      size: 0.6 + rnd() * 0.8,
      spin: (rnd() - 0.5) * 2,
    }));
  }, [spawn.id]);
  const material = useMemo(
    () =>
      new THREE.SpriteMaterial({
        map: getPuffTexture(),
        color: "#2a1240",
        transparent: true,
        opacity: 0.55,
        depthWrite: false,
      }),
    [],
  );
  const state = useRef({ age: 0, done: false });

  useEffect(() => () => material.dispose(), [material]);

  useFrame((_, delta) => {
    const s = state.current;
    s.age += Math.min(delta, 1 / 20) * Math.max(fx.timeScale, 0.3);
    const k = spawn.scale;
    const spread = (1 - Math.exp(-s.age * 3)) / 3;
    group.current?.children.forEach((child, i) => {
      const p = puffs[i];
      child.position
        .set(...spawn.position)
        .addScaledVector(p.dir, p.speed * spread * k);
      child.position.y += s.age * 0.18 * k;
      child.scale.setScalar((0.15 + s.age * 0.7 * p.size) * k);
    });
    material.rotation += 0.002;
    material.opacity = 0.55 * (1 - THREE.MathUtils.smoothstep(s.age, 0.3, LIFETIME));
    if (s.age > LIFETIME && !s.done) {
      s.done = true;
      onDone(spawn.id);
    }
  });

  return (
    <group ref={group}>
      {puffs.map((_, i) => (
        <sprite key={i} material={material} raycast={() => null} />
      ))}
    </group>
  );
}
