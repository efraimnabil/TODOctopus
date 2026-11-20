import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import type { Tentacle as TentacleModel } from "@/game/scene";
import type { LabelStore } from "../labels";
import {
  attract,
  collideFloor,
  createChain,
  integrate,
  pinPoint,
  solveDistances,
} from "../physics/verlet";
import { DISC_SUCKERS, SUBDIVISIONS, TubeBuilder, writeSuckers } from "../geometry/tube";
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
import { armColor, createSkinMaterial, disposeSkinMaterial } from "./materials";
import { getCupSuckerGeometry } from "./skinDetail";
import { createPoseParams, writePose } from "./pose";
import type { HoverState, OctoState, TuningRef } from "./shared";
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
  /** Shared registry so the arm webbing can read neighbouring arms */
  tubes: Map<number, TubeBuilder>;
  hover: HoverState;
  /** Picked in the task list */
  selected?: boolean;
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
  tubes,
  hover,
  selected = false,
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
  const controls = useThree((st) => st.controls) as unknown as { enabled: boolean } | null;
  /** A press that began on this arm: dragging far enough slashes it */
  const swipe = useRef<(() => void) | null>(null);
  /** Seconds the pointer has been clearly away from this hovered arm */
  const awayFor = useRef(0);
  const material = useMemo(
    () => createSkinMaterial(palette, true, undefined, species, "arm"),
    [palette, species],
  );
  const suckerLayout = species.suckers ?? DISC_SUCKERS;
  const cupGeometry = species.suckers?.cup ? getCupSuckerGeometry() : null;
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
      select: 0,
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

  useEffect(() => () => disposeSkinMaterial(material), [material]);
  useEffect(() => () => tube.dispose(), [tube]);
  useEffect(() => {
    tubes.set(model.slot, tube);
    return () => {
      if (tubes.get(model.slot) === tube) tubes.delete(model.slot);
    };
  }, [tubes, tube, model.slot]);

  useEffect(() => {
    if (!labels) return;
    if (hovered && canCut) labels.hovered = model.id;
    else if (labels.hovered === model.id) labels.hovered = null;
  }, [labels, hovered, canCut, model.id]);

  useEffect(() => {
    if (hovered) hover.onChange?.(model.id);
    // Only clear if no other arm has taken over the hover meanwhile.
    else if (!hover.owner) hover.onChange?.(null);
  }, [hovered, hover, model.id]);

  useEffect(() => {
    if (!hovered) return;
    document.body.style.cursor = "crosshair";
    return () => {
      // Another arm may have taken over the hover; leave its cursor alone.
      if (!hover.owner) document.body.style.cursor = "";
    };
  }, [hovered, hover]);

  useEffect(() => {
    if (labels && !canCut) labels.anchors.delete(model.id);
    return () => {
      labels?.anchors.delete(model.id);
    };
  }, [labels, canCut, model.id]);

  useFrame((state, delta) => {
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
    s.select += ((selected && canCut ? 1 : 0) - s.select) * damp(6, dt);

    const sc = octo.scale;
    const ax = rx * arm.anchorRing * sc;
    const ay = octo.offsetY + arm.anchorY * sc;
    const az = rz * arm.anchorRing * sc;
    const { chain, target, pose } = s;
    const count = s.activeCount;
    chain.count = count;
    chain.rest = segmentLength(arm) * sc * Math.max(0.02, s.grow);
    s.radiusScale = sc * (0.35 + 0.65 * s.grow) * (1 + 0.1 * s.hover);

    const hurt = fx.hurt;
    pose.count = count;
    pose.segment = chain.rest;
    // Hover reacts in place (glow, tense, slight rise) rather than swinging
    // the arm away from the cursor.
    pose.pitch = tune.pitch + s.hover * 0.12 + hurt * 0.45 + octo.death * 0.7;
    pose.curl = (s.stump ? 3.6 : tune.curl) + hurt * 1.4 + octo.death * 1.6;
    pose.waveAmp = tune.wave * (1 + hurt * 1.5) * (1 - 0.7 * s.hover);
    pose.waveSpeed = 1.4 + hurt * 4;
    pose.swayAmp = tune.sway * (1 - 0.7 * s.hover);
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
    if (suckers.current) writeSuckers(suckers.current, tube, 3, tube.rings - 3, suckerLayout);

    if (hovered) {
      if (!canCut || hover.owner !== model.id) {
        release();
      } else {
        const near = nearestOnScreen(tube, state.camera, state.pointer, state.size);
        awayFor.current = near.distance > HOVER_KEEP_PX ? awayFor.current + delta : 0;
        if (awayFor.current > HOVER_RELEASE_S) release();
        else hover.cut = () => onCut(model.id, Math.round(near.ring / SUBDIVISIONS));
      }
    }

    // Selected arms breathe a soft glow; hover glows steady and brighter.
    const pulse = 0.28 + 0.14 * Math.sin(s.time * 4);
    material.emissiveIntensity = Math.max(s.hover * 0.55, s.select * pulse);
    material.opacity = octo.opacity;
    material.transparent = octo.opacity < 0.999;

    if (labels && canCut && tube.rings > 0) {
      const r = Math.round((tube.rings - 1) * 0.62) * 3;
      labels
        .anchor(model.id)
        .set(tube.centers[r], tube.centers[r + 1] + 0.32, tube.centers[r + 2]);
    }
  });

  function release() {
    awayFor.current = 0;
    setHovered(false);
    if (hover.owner === model.id) {
      hover.owner = null;
      hover.cut = null;
    }
  }

  const handleOver = (e: ThreeEvent<PointerEvent>) => {
    if (!canCut) return;
    e.stopPropagation();
    awayFor.current = 0;
    hover.owner = model.id;
    setHovered(true);
  };
  // Pressing on an arm and dragging away slashes it where it was pressed
  // (the camera doesn't orbit meanwhile). A press that barely moves is a
  // click instead. Tracked on window so a quick flick can't lose the arm.
  const handleDown = (e: ThreeEvent<PointerEvent>) => {
    if (!canCut) return;
    swipe.current?.();
    const start = { x: e.clientX, y: e.clientY };
    const ring = Math.round(tube.nearestRing(e.point.x, e.point.y, e.point.z) / SUBDIVISIONS);
    if (controls) controls.enabled = false;
    const stop = () => {
      swipe.current = null;
      if (controls) controls.enabled = true;
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", stop);
      window.removeEventListener("pointercancel", stop);
    };
    const move = (ev: PointerEvent) => {
      if (Math.hypot(ev.clientX - start.x, ev.clientY - start.y) < SWIPE_PX) return;
      stop();
      onCut(model.id, ring);
    };
    swipe.current = stop;
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", stop);
    window.addEventListener("pointercancel", stop);
  };
  useEffect(() => () => swipe.current?.(), []);

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    if (!canCut || e.delta > 6) return;
    e.stopPropagation();
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
        onPointerDown={interactive ? handleDown : undefined}
        onClick={interactive ? handleClick : undefined}
      />
      <instancedMesh
        ref={suckers}
        args={[cupGeometry ?? undefined, suckerMaterial, tube.maxRings]}
        frustumCulled={false}
        raycast={() => null}
      >
        {!cupGeometry && <cylinderGeometry args={[1, 1, 1, 14]} />}
      </instancedMesh>
    </group>
  );
}

/** Drag this far (px) from where a press began on an arm to slash it */
const SWIPE_PX = 28;
/** Keep the hover while the pointer is within this many pixels of the arm */
const HOVER_KEEP_PX = 70;
/** …and drop it after the pointer has been further away for this long */
const HOVER_RELEASE_S = 0.25;

const projected = new THREE.Vector3();

/** Closest ring of the arm to the pointer, in screen pixels. */
function nearestOnScreen(
  tube: TubeBuilder,
  camera: THREE.Camera,
  pointer: THREE.Vector2,
  size: { width: number; height: number },
) {
  const px = (pointer.x * 0.5 + 0.5) * size.width;
  const py = (-pointer.y * 0.5 + 0.5) * size.height;
  let distance = Infinity;
  let ring = 0;
  for (let r = 0; r < tube.rings; r += 2) {
    const k = r * 3;
    projected.set(tube.centers[k], tube.centers[k + 1], tube.centers[k + 2]).project(camera);
    const dx = (projected.x * 0.5 + 0.5) * size.width - px;
    const dy = (-projected.y * 0.5 + 0.5) * size.height - py;
    const d = Math.hypot(dx, dy);
    if (d < distance) {
      distance = d;
      ring = r;
    }
  }
  return { distance, ring };
}
