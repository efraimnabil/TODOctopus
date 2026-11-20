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
import type { Priority } from "@/game/types";
import { LabPanel } from "@/components/lab/LabPanel";
import { FxBus } from "./fx/FxBus";
import { FxDriver, FxLayer, ShakeGroup } from "./fx/FxLayer";
import { createPalette } from "./octopus/constants";
import { OctopusRig } from "./octopus/OctopusRig";
import { DEFAULT_TUNING, type Tuning } from "./octopus/shared";
import { Effects } from "./scene/Effects";
import { FitCamera } from "./scene/FitCamera";
import { Underwater } from "./scene/Underwater";
import { LabelProjector, LabelStore, TentacleLabels } from "./labels";

export type Quality = "high" | "low";

const NARROW = "(max-width: 767px)";
const subscribeNarrow = (cb: () => void) => {
  const media = window.matchMedia(NARROW);
  media.addEventListener("change", cb);
  return () => media.removeEventListener("change", cb);
};

export default function OctopusLab() {
  const [state, dispatch] = useReducer(labReducer, undefined, () => createLabState());
  const [quality, setQuality] = useState<Quality>("high");
  const [showLabels, setShowLabels] = useState(true);
  const narrow = useSyncExternalStore(
    subscribeNarrow,
    () => window.matchMedia(NARROW).matches,
    () => false,
  );
  const fx = useMemo(() => new FxBus(), []);
  const labels = useMemo(() => new LabelStore(), []);
  const palette = useMemo(() => createPalette(state.octopus.seed), [state.octopus.seed]);

  const tuningValues = useControls("Tentacles", {
    stiffness: { value: DEFAULT_TUNING.stiffness, min: 0.02, max: 0.4, step: 0.01 },
    curl: { value: DEFAULT_TUNING.curl, min: 0, max: 3, step: 0.05 },
    wave: { value: DEFAULT_TUNING.wave, min: 0, max: 2, step: 0.05 },
    sway: { value: DEFAULT_TUNING.sway, min: 0, max: 1, step: 0.05 },
    pitch: { value: DEFAULT_TUNING.pitch, min: -1.5, max: 0.5, step: 0.05 },
    gravity: { value: DEFAULT_TUNING.gravity, min: -6, max: 2, step: 0.1 },
  });
  const tuning = useRef<Tuning>(DEFAULT_TUNING);
  useEffect(() => {
    tuning.current = tuningValues;
  }, [tuningValues]);

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

  // "Kill it": slash the remaining tentacles one after another.
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const killAll = useCallback(() => {
    const alive = state.octopus.tentacles.filter((t) => t.status === "alive");
    alive.forEach((t, i) => {
      timers.current.push(window.setTimeout(() => cut(t.id), i * 320));
    });
  }, [state.octopus.tentacles, cut]);

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-abyss">
      <Canvas
        dpr={quality === "high" ? [1, 2] : 1}
        camera={{ position: [0, 2.8, 8.2], fov: 38 }}
        gl={{ antialias: quality === "high" }}
      >
        <Suspense fallback={null}>
          <PerformanceMonitor onDecline={() => setQuality("low")} />
          <FxDriver fx={fx} />
          <ShakeGroup fx={fx}>
            <Underwater quality={quality} />
            <OctopusRig
              key={state.octopus.id}
              model={state.octopus}
              fx={fx}
              tuning={tuning}
              labels={showLabels ? labels : null}
              onCut={cut}
              onRetracted={retracted}
              onDead={dead}
            />
            <FxLayer fx={fx} palette={palette} />
          </ShakeGroup>
          <OrbitControls
            makeDefault
            target={[0, 1.2, 0]}
            enablePan={false}
            enableDamping
            minDistance={3.5}
            maxDistance={15}
            minPolarAngle={0.5}
            maxPolarAngle={1.5}
          />
          <FitCamera />
          <LabelProjector store={labels} />
          {quality === "high" && <Effects />}
        </Suspense>
      </Canvas>

      {showLabels && state.octopus.status === "alive" && (
        <TentacleLabels
          store={labels}
          tentacles={state.octopus.tentacles.filter((t) => t.status === "alive")}
        />
      )}

      <LabPanel
        state={state}
        quality={quality}
        showLabels={showLabels}
        onAdd={(title: string, priority: Priority) => dispatch({ type: "grow", title, priority })}
        onCut={(id) => cut(id)}
        onRetract={(id) => dispatch({ type: "retract", id })}
        onKillAll={killAll}
        onSpawn={() => dispatch({ type: "spawn", seed: Math.floor(Math.random() * 1000) })}
        onToggleLabels={() => setShowLabels((v) => !v)}
        onToggleQuality={() => setQuality((q) => (q === "high" ? "low" : "high"))}
      />
      <Leva collapsed hidden={narrow} titleBar={{ title: "Tuning" }} />
    </div>
  );
}
