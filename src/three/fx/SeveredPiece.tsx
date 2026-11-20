import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import {
  collideFloor,
  createChain,
  integrate,
  solveDistances,
} from "../physics/verlet";
import { DISC_SUCKERS, SUBDIVISIONS, TubeBuilder, writeSuckers } from "../geometry/tube";
import { STEP, radiusAt, type Palette } from "../octopus/constants";
import {
  armColor,
  createSkinMaterial,
  createSuckerMaterial,
  disposeSkinMaterial,
} from "../octopus/materials";
import { getCupSuckerGeometry } from "../octopus/skinDetail";
import type { Species } from "../octopus/species";
import { useLazyRef } from "../useLazyRef";
import type { FxBus, SeveredSpawn } from "./FxBus";

const LIFETIME = 3.9;

interface Props {
  spawn: SeveredSpawn;
  palette: Palette;
  species: Species;
  fx: FxBus;
  onDone: (id: number) => void;
}

/**
 * The cut-off part of a tentacle: flung out, falls to the sand, wriggles
 * for a couple of seconds, then fades away.
 */
export function SeveredPiece({ spawn, palette, species, fx, onDone }: Props) {
  const tube = useMemo(() => new TubeBuilder(spawn.count), [spawn.count]);
  const material = useMemo(() => {
    const m = createSkinMaterial(palette, true, undefined, species, "arm");
    m.transparent = true;
    return m;
  }, [palette, species]);
  const suckerLayout = species.suckers ?? DISC_SUCKERS;
  const cupGeometry = species.suckers?.cup ? getCupSuckerGeometry() : null;
  const suckerMat = useMemo(() => {
    const m = createSuckerMaterial(palette);
    m.transparent = true;
    return m;
  }, [palette]);
  const suckers = useRef<THREE.InstancedMesh>(null);

  const sim = useLazyRef(() => {
    const chain = createChain(spawn.count, spawn.rest);
    chain.pos.set(spawn.pos);
    chain.prev.set(spawn.prev);
    const [fx0, fy0, fz0] = spawn.fling;
    for (let i = 0; i < spawn.count; i++) {
      const w = 0.6 + (0.7 * i) / spawn.count;
      chain.prev[i * 3] -= fx0 * STEP * w;
      chain.prev[i * 3 + 1] -= fy0 * STEP * w;
      chain.prev[i * 3 + 2] -= fz0 * STEP * w;
    }
    const s = {
      chain,
      age: 0,
      acc: 0,
      fade: 1,
      done: false,
      arc: (ring: number, rings: number) =>
        spawn.s0 + (ring / Math.max(1, rings - 1)) * (1 - spawn.s0),
      radiusOfPoint: (i: number) =>
        radiusAt(spawn.s0 + (i / (spawn.count - 1)) * (1 - spawn.s0), species.arm) * s.fade,
      radiusOfRing: (ring: number, rings: number) => {
        if (ring === 0) return 0;
        const r = radiusAt(s.arc(ring, rings), species.arm) * s.fade;
        return ring === 1 ? r * 0.8 : r;
      },
      colorOfRing: (ring: number, rings: number, a: number, out: THREE.Color) => {
        armColor(palette, species, s.arc(ring, rings), a, out);
        if (ring <= 1) out.lerp(palette.wound, 0.75);
      },
    };
    return s;
  });

  useEffect(
    () => () => {
      tube.dispose();
      disposeSkinMaterial(material);
      suckerMat.dispose();
    },
    [tube, material, suckerMat],
  );

  useFrame((_, delta) => {
    const s = sim.current;
    const dt = Math.min(delta, 1 / 20) * fx.timeScale;
    s.age += dt;
    s.acc += dt;
    const wiggle = Math.pow(Math.max(0, 1 - s.age / 2.6), 1.5);
    const { chain } = s;
    let steps = 0;
    while (s.acc >= STEP && steps < 4) {
      s.acc -= STEP;
      steps++;
      integrate(chain, STEP, -6, 0.975, 0);
      // Writhe: a travelling wave pushing along each ring's "up" axis.
      if (tube.rings > 0) {
        for (let i = 0; i < chain.count; i++) {
          const r = Math.min(i * SUBDIVISIONS, tube.rings - 1) * 3;
          const push =
            Math.sin(s.age * 15 - i * 0.9) * wiggle * 0.011 * (0.5 + i / chain.count);
          chain.pos[i * 3] += tube.ups[r] * push;
          chain.pos[i * 3 + 1] += tube.ups[r + 1] * push;
          chain.pos[i * 3 + 2] += tube.ups[r + 2] * push;
        }
      }
      solveDistances(chain, 5, 0);
      collideFloor(chain, 0, s.radiusOfPoint, 0.35);
    }
    if (steps === 4) s.acc = 0;

    s.fade = 1 - THREE.MathUtils.clamp((s.age - 2.8) / (LIFETIME - 2.8), 0, 1);
    tube.update(chain.pos, chain.count, spawn.side, s.radiusOfRing, s.colorOfRing);
    if (suckers.current) writeSuckers(suckers.current, tube, 2, tube.rings - 2, suckerLayout);
    material.opacity = s.fade;
    suckerMat.opacity = s.fade;

    if (s.age > LIFETIME && !s.done) {
      s.done = true;
      onDone(spawn.id);
    }
  });

  return (
    <group>
      <mesh geometry={tube.geometry} material={material} frustumCulled={false} raycast={() => null} />
      <instancedMesh
        ref={suckers}
        args={[cupGeometry ?? undefined, suckerMat, tube.maxRings]}
        frustumCulled={false}
        raycast={() => null}
      >
        {!cupGeometry && <cylinderGeometry args={[1, 1, 1, 14]} />}
      </instancedMesh>
    </group>
  );
}
