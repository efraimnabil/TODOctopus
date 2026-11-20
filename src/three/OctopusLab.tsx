"use client";

import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, PerformanceMonitor } from "@react-three/drei";
import { Leva, useControls } from "leva";
import { createLabState, labReducer } from "@/game/lab";
import type { Octopus, Priority } from "@/game/types";
import { LabPanel } from "@/components/lab/LabPanel";
import { FxBus } from "./fx/FxBus";
import { FxDriver, FxLayer, ShakeGroup } from "./fx/FxLayer";
import { createPalette } from "./octopus/constants";
import { OctopusRig } from "./octopus/OctopusRig";
import { DEFAULT_TUNING, createHoverState, type Tuning } from "./octopus/shared";
import {
  SPECIES,
  SPECIES_LIST,
  loadSpeciesChoice,
  saveSpeciesChoice,
  type SpeciesId,
} from "./octopus/species";
import { Effects } from "./scene/Effects";
import { FitCamera } from "./scene/FitCamera";
import { Underwater } from "./scene/Underwater";
import { LabelProjector, LabelStore, SpeciesTags, TentacleLabels } from "./labels";

export type Quality = "high" | "low";

const NARROW = "(max-width: 767px)";
const subscribeNarrow = (cb: () => void) => {
  const media = window.matchMedia(NARROW);
  media.addEventListener("change", cb);
  return () => media.removeEventListener("change", cb);
};

const LINEUP_X = [-18, -9, 0, 9, 18];
const NOOP = () => {};

/** Display-only octopus with all 8 arms, used to compare body shapes. */
const LINEUP_MODEL: Octopus = {
  id: "lineup",
  name: "Lineup",
  seed: 11,
  status: "alive",
  tentacles: Array.from({ length: 8 }, (_, slot) => ({
    id: `lineup-${slot}`,
    slot,
    title: "",
    priority: 2 as const,
    status: "alive" as const,
  })),
};

const LINEUP_TAGS = SPECIES_LIST.map((s, i) => ({
  id: s.id,
  name: s.name,
  position: [
    LINEUP_X[i],
    s.mantle.centerY + s.mantle.radius * s.mantle.stretch + 0.8,
    0,
  ] as [number, number, number],
}));

export type LabView = "single" | "lineup";

export default function OctopusLab() {
  const [state, dispatch] = useReducer(labReducer, undefined, () => createLabState());
  const [quality, setQuality] = useState<Quality>("high");
  const [showLabels, setShowLabels] = useState(true);
  const [speciesId, setSpeciesId] = useState<SpeciesId>(loadSpeciesChoice);
  const [view, setView] = useState<LabView>("single");
  const species = SPECIES[speciesId];
  const narrow = useSyncExternalStore(
    subscribeNarrow,
    () => window.matchMedia(NARROW).matches,
    () => false,
  );
  const fx = useMemo(() => new FxBus(), []);
  const labels = useMemo(() => new LabelStore(), []);
  const hover = useMemo(() => createHoverState(), []);
  const pointerDown = useRef({ x: 0, y: 0 });
  const palette = useMemo(
    () => createPalette(state.octopus.seed, species),
    [state.octopus.seed, species],
  );

  const [tuningValues, setTuning] = useControls("Tentacles", () => ({
    stiffness: { value: DEFAULT_TUNING.stiffness, min: 0.02, max: 0.4, step: 0.01 },
    curl: { value: DEFAULT_TUNING.curl, min: 0, max: 3, step: 0.05 },
    wave: { value: DEFAULT_TUNING.wave, min: 0, max: 2, step: 0.05 },
    sway: { value: DEFAULT_TUNING.sway, min: 0, max: 1, step: 0.05 },
    pitch: { value: DEFAULT_TUNING.pitch, min: -1.5, max: 0.5, step: 0.05 },
    gravity: { value: DEFAULT_TUNING.gravity, min: -6, max: 2, step: 0.1 },
  }));
  // Each species brings its own natural motion; the panel can still tweak it.
  useEffect(() => {
    setTuning({ ...DEFAULT_TUNING, ...species.tuning });
  }, [species, setTuning]);
  const tuning = useRef<Tuning>({ ...DEFAULT_TUNING, ...species.tuning });
  useEffect(() => {
    tuning.current = tuningValues;
  }, [tuningValues]);
  const lineupTuning = useMemo(
    () =>
      Object.fromEntries(
        SPECIES_LIST.map((s) => [s.id, { current: { ...DEFAULT_TUNING, ...s.tuning } }]),
      ) as Record<SpeciesId, { current: Tuning }>,
    [],
  );

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      fx.reducedMotion = media.matches;
    };
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, [fx]);

  const cut = useCallback((id: string, cutIndex?: number) => dispatch({ type: "cut", id, cutIndex }), []);
  const retracted = useCallback((id: string) => dispatch({ type: "retracted", id }), []);
  const dead = useCallback(() => dispatch({ type: "dead" }), []);
  const pickSpecies = useCallback((id: SpeciesId) => {
    setSpeciesId(id);
    saveSpeciesChoice(id);
    setView("single");
  }, []);

  // "Kill it": slash the remaining tentacles one after another.
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const killAll = useCallback(() => {
    const alive = state.octopus.tentacles.filter((t) => t.status === "alive");
    alive.forEach((t, i) => {
      timers.current.push(window.setTimeout(() => cut(t.id), i * 320));
    });
  }, [state.octopus.tentacles, cut]);

  const lineup = view === "lineup";

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-abyss">
      <Canvas
        // Fixed for the whole session: changing dpr at runtime can race a
        // resize and leave the renderer and canvas at different sizes.
        dpr={[1, 2]}
        camera={{ position: [0, 2.8, 8.2], fov: 38 }}
        // Opaque canvas: nothing in the scene should ever show the page through.
        gl={{ antialias: quality === "high", alpha: false }}
        onPointerDown={(e) => {
          pointerDown.current = { x: e.clientX, y: e.clientY };
        }}
        // A hovered arm lifts a little and may slide off the cursor: a click
        // that misses every mesh still slashes the arm that's hovered.
        onPointerMissed={(e) => {
          const moved = Math.hypot(
            e.clientX - pointerDown.current.x,
            e.clientY - pointerDown.current.y,
          );
          if (moved < 6) hover.cut?.();
        }}
      >
        <Suspense fallback={null}>
          <PerformanceMonitor onDecline={() => setQuality("low")} />
          <FxDriver fx={fx} />
          <ShakeGroup fx={fx}>
            <Underwater quality={quality} fogDensity={lineup ? 0.011 : 0.055} />
            {lineup ? (
              SPECIES_LIST.map((s, i) => (
                <group key={s.id} position={[LINEUP_X[i], 0, 0]}>
                  <OctopusRig
                    model={LINEUP_MODEL}
                    species={s}
                    fx={fx}
                    tuning={lineupTuning[s.id]}
                    labels={null}
                    interactive={false}
                    onCut={NOOP}
                    onRetracted={NOOP}
                    onDead={NOOP}
                  />
                </group>
              ))
            ) : (
              <OctopusRig
                key={`${state.octopus.id}-${species.id}`}
                model={state.octopus}
                species={species}
                fx={fx}
                tuning={tuning}
                labels={showLabels ? labels : null}
                hover={hover}
                onCut={cut}
                onRetracted={retracted}
                onDead={dead}
              />
            )}
            <FxLayer fx={fx} palette={palette} species={species} />
          </ShakeGroup>
          <OrbitControls
            makeDefault
            enablePan={false}
            enableDamping
            minDistance={3.5}
            maxDistance={lineup ? 90 : 18}
            minPolarAngle={0.5}
            maxPolarAngle={1.5}
          />
          <FitCamera distanceScale={lineup ? 1 : species.view} lineup={lineup} />
          <LabelProjector store={labels} />
          {quality === "high" && <Effects />}
        </Suspense>
      </Canvas>

      {lineup ? (
        <SpeciesTags
          store={labels}
          items={LINEUP_TAGS}
          onPick={(id) => pickSpecies(id as SpeciesId)}
        />
      ) : (
        showLabels &&
        state.octopus.status === "alive" && (
          <TentacleLabels
            store={labels}
            tentacles={state.octopus.tentacles.filter((t) => t.status === "alive")}
          />
        )
      )}

      <LabPanel
        state={state}
        view={view}
        speciesId={speciesId}
        quality={quality}
        showLabels={showLabels}
        onPickSpecies={pickSpecies}
        onCompare={() => setView("lineup")}
        onAdd={(title: string, priority: Priority) => dispatch({ type: "grow", title, priority })}
        onCut={(id) => cut(id)}
        onRetract={(id) => dispatch({ type: "retract", id })}
        onKillAll={killAll}
        onSpawn={() => dispatch({ type: "spawn", seed: Math.floor(Math.random() * 1000) })}
        onToggleLabels={() => setShowLabels((v) => !v)}
        onToggleQuality={() => setQuality((q) => (q === "high" ? "low" : "high"))}
      />
      <Leva collapsed hidden={narrow || lineup} titleBar={{ title: "Tuning" }} />
    </div>
  );
}
