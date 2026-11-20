"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { Leva, useControls } from "leva";
import { createLabState, labReducer } from "@/game/lab";
import type { Octopus, Priority } from "@/game/scene";
import { LabPanel } from "@/components/lab/LabPanel";
import { createPalette } from "./octopus/constants";
import { OctopusRig } from "./octopus/OctopusRig";
import { DEFAULT_TUNING, type Tuning } from "./octopus/shared";
import {
  SPECIES,
  SPECIES_LIST,
  loadSpeciesChoice,
  saveSpeciesChoice,
  type SpeciesId,
} from "./octopus/species";
import { SpeciesTags, TentacleLabels } from "./labels";
import { SceneCanvas, useSceneKit, type Quality } from "./SceneCanvas";

export type { Quality };

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
  const kit = useSceneKit();
  const { fx, labels, hover } = kit;
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
      <SceneCanvas
        kit={kit}
        quality={quality}
        onSlow={() => setQuality("low")}
        palette={palette}
        species={species}
        distanceScale={lineup ? 1 : species.view}
        lineup={lineup}
      >
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
      </SceneCanvas>

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
