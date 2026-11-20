import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import type { Tentacle as TentacleModel } from "@/game/types";
import type { LabelStore } from "../labels";
import {
  attract,
  collideFloor,
  createChain,
  integrate,
  pinPoint,
  solveDistances,
} from "../physics/verlet";
import { SUBDIVISIONS, TubeBuilder, writeSuckers } from "../geometry/tube";
import type { FxBus, Vec3 } from "../fx/FxBus";
import { useLazyRef } from "../useLazyRef";
import {
  CHAIN_POINTS,
  SLOT_ANGLES_DEG,
  STEP,
  damp,
  radiusAt,
  segmentLength,
  type Palette,
} from "./constants";
import { armColor, createSkinMaterial } from "./materials";
import { createPoseParams, writePose } from "./pose";
import type { OctoState, TuningRef } from "./shared";
import type { Species } from "./species";

interface Props {
  model: TentacleModel;
  species: Species;
  octo: OctoState;
  palette: Palette;
  suckerMaterial: THREE.Material;
  fx: FxBus;
  tuning: TuningRef;
  labels: LabelStore | null;
  interactive: boolean;
  onCut: (id: string, cutIndex: number) => void;
  onRetracted: (id: string) => void;
}

export function Tentacle({
  model,
  species,
  octo,
  palette,
  suckerMaterial,
  fx,
  tuning,
  labels,
  interactive,
  onCut,
  onRetracted,
}: Props) {
  const angle = THREE.MathUtils.degToRad(SLOT_ANGLES_DEG[model.slot]);
  const rx = Math.sin(angle);
  const rz = Math.cos(angle);
  const canCut = interactive && model.status === "alive";
  const arm = species.arm;

  const [hovered, setHovered] = useState(false);
  const material = useMemo(() => createSkinMaterial(palette), [palette]);
  const tube = useMemo(() => new TubeBuilder(CHAIN_POINTS), []);
  const suckers = useRef<THREE.InstancedMesh>(null);

  const sim = useLazyRef(() => {
    const side: Vec3 = [-rz, 0, rx];
    const s = {
      chain: createChain(CHAIN_POINTS, 0.001),
      target: new Float32Array(CHAIN_POINTS * 3),
      pose: createPoseParams(),
      side,
      time: model.slot * 1.9,
      phase: model.slot * 1.37,
      acc: 0,
      grow: 0,
      hover: 0,
      radiusScale: 0.3,
      activeCount: CHAIN_POINTS,
      stump: false,
      initialized: false,
      retractedSent: false,
    };
    return s;
  });

  // Closures read the latest species/palette, so they're rebuilt with them.
  const shapeFns = useMemo(() => {
    const s = sim.current;
    return {
      radiusOfPoint: (i: number) =>
        radiusAt(i / (CHAIN_POINTS - 1), arm) * s.radiusScale,
      radiusOfRing: (ring: number, rings: number) => {
        let r = radiusAt(ring / (tube.maxRings - 1), arm) * s.radiusScale;
        if (s.stump) {
          if (ring === rings - 1) r = 0;
          else if (ring === rings - 2) r *= 0.8;
        }
        return r;
      },
      colorOfRing: (ring: number, rings: number, a: number, out: THREE.Color) => {
        armColor(palette, species, ring / (tube.maxRings - 1), a, out);
        if (s.stump && ring >= rings - 2) out.lerp(palette.wound, 0.75);
      },
    };
  }, [sim, arm, tube, palette, species]);

  // Slash: split the chain, hand the tail to the scene as a severed piece.
  useEffect(() => {
    const s = sim.current;
    if (model.status !== "cut" || s.stump) return;
    const N = CHAIN_POINTS;
    const idx = Math.min(N - 5, Math.max(4, model.cutIndex ?? Math.round(N * 0.5)));
    if (s.initialized) {
      const { chain } = s;
      const k = idx * 3;
      fx.emit("severed", {
        id: fx.id(),
        pos: chain.pos.slice(k, N * 3),
        prev: chain.prev.slice(k, N * 3),
        count: N - idx,
        s0: idx / (N - 1),
        rest: chain.rest,
        side: s.side,
        fling: [rx * 1.3, 2.4, rz * 1.3],
        seed: model.slot * 101 + idx,
      });
      const position: Vec3 = [chain.pos[k], chain.pos[k + 1], chain.pos[k + 2]];
      const tangent: Vec3 = [
        chain.pos[k + 3] - chain.pos[k - 3],
        chain.pos[k + 4] - chain.pos[k - 2],
        chain.pos[k + 5] - chain.pos[k - 1],
      ];
      fx.emit("slash", { id: fx.id(), position, tangent });
      fx.emit("ink", { id: fx.id(), position, scale: 0.7 });
      fx.hit(1);
    }
    s.stump = true;
    s.activeCount = idx + 1;
  }, [model.status, model.cutIndex, model.slot, fx, rx, rz, sim]);

  useEffect(
    () => () => {
      material.dispose();
    },
    [material],
  );
  useEffect(() => () => tube.dispose(), [tube]);

  useEffect(() => {
    if (!labels) return;
    if (hovered && canCut) labels.hovered = model.id;
    else if (labels.hovered === model.id) labels.hovered = null;
  }, [labels, hovered, canCut, model.id]);

  useEffect(() => {
    if (labels && !canCut) labels.anchors.delete(model.id);
    return () => {
      labels?.anchors.delete(model.id);
    };
  }, [labels, canCut, model.id]);

  useFrame((_, delta) => {
    const s = sim.current;
    const tune = tuning.current;
    const dt = Math.min(delta, 1 / 20) * fx.timeScale;
    s.time += dt;

    const retracting = model.status === "retracting";
    s.grow += ((retracting ? 0 : 1) - s.grow) * damp(retracting ? 6 : 2.6, dt);
    if (retracting && s.grow < 0.03 && !s.retractedSent) {
      s.retractedSent = true;
      onRetracted(model.id);
    }
    s.hover += ((hovered && canCut ? 1 : 0) - s.hover) * damp(8, dt);

    const sc = octo.scale;
    const ax = rx * arm.anchorRing * sc;
    const ay = octo.offsetY + arm.anchorY * sc;
    const az = rz * arm.anchorRing * sc;
    const { chain, target, pose } = s;
    const count = s.activeCount;
    chain.count = count;
    chain.rest = segmentLength(arm) * sc * Math.max(0.02, s.grow);
    s.radiusScale = sc * (0.35 + 0.65 * s.grow);

    const hurt = fx.hurt;
    pose.count = count;
    pose.segment = chain.rest;
    pose.pitch = tune.pitch + s.hover * 0.9 + hurt * 0.45 + octo.death * 0.7;
    pose.curl = (s.stump ? 3.6 : tune.curl) + hurt * 1.4 + octo.death * 1.6;
    pose.waveAmp = tune.wave * (1 + hurt * 1.5);
    pose.waveSpeed = 1.4 + hurt * 4;
    pose.swayAmp = tune.sway;
    pose.phase = s.phase;
    pose.time = s.time;
    writePose(target, ax, ay, az, rx, rz, pose);

    if (!s.initialized) {
      chain.pos.set(target);
      chain.prev.set(target);
      s.initialized = true;
    }

    s.acc += dt;
    let steps = 0;
    while (s.acc >= STEP && steps < 4) {
      s.acc -= STEP;
      steps++;
      integrate(chain, STEP, tune.gravity, 0.9, 2);
      attract(chain, target, tune.stiffness, 2);
      pinPoint(chain, 0, target[0], target[1], target[2]);
      pinPoint(chain, 1, target[3], target[4], target[5]);
      solveDistances(chain, 6, 2);
      collideFloor(chain, 0, shapeFns.radiusOfPoint, 0.25);
    }
    if (steps === 4) s.acc = 0;

    tube.update(chain.pos, count, s.side, shapeFns.radiusOfRing, shapeFns.colorOfRing);
    if (suckers.current) writeSuckers(suckers.current, tube, 3, tube.rings - 3);

    material.emissiveIntensity = s.hover * 0.45;
    material.opacity = octo.opacity;
    material.transparent = octo.opacity < 0.999;

    if (labels && canCut && tube.rings > 0) {
      const r = Math.round((tube.rings - 1) * 0.62) * 3;
      labels
        .anchor(model.id)
        .set(tube.centers[r], tube.centers[r + 1] + 0.32, tube.centers[r + 2]);
    }
  });

  const handleOver = (e: ThreeEvent<PointerEvent>) => {
    if (!canCut) return;
    e.stopPropagation();
    setHovered(true);
    document.body.style.cursor = "crosshair";
  };
  const handleOut = () => {
    setHovered(false);
    document.body.style.cursor = "";
  };
  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    if (!canCut || e.delta > 6) return;
    e.stopPropagation();
    document.body.style.cursor = "";
    const ring = tube.nearestRing(e.point.x, e.point.y, e.point.z);
    onCut(model.id, Math.round(ring / SUBDIVISIONS));
  };

  return (
    <group>
      <mesh
        geometry={tube.geometry}
        material={material}
        frustumCulled={false}
        onPointerOver={interactive ? handleOver : undefined}
        onPointerOut={interactive ? handleOut : undefined}
        onClick={interactive ? handleClick : undefined}
      />
      <instancedMesh
        ref={suckers}
        args={[undefined, suckerMaterial, tube.maxRings]}
        frustumCulled={false}
        raycast={() => null}
      >
        <cylinderGeometry args={[1, 1, 1, 14]} />
      </instancedMesh>
    </group>
  );
}
