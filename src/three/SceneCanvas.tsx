"use client";

import { Suspense, useEffect, useMemo, useRef, type ReactNode } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, PerformanceMonitor } from "@react-three/drei";
import { FxBus } from "./fx/FxBus";
import { FxDriver, FxLayer, ShakeGroup } from "./fx/FxLayer";
import type { Palette } from "./octopus/constants";
import { createHoverState, type HoverState } from "./octopus/shared";
import type { Species } from "./octopus/species";
import { Effects } from "./scene/Effects";
import { FitCamera } from "./scene/FitCamera";
import { Underwater } from "./scene/Underwater";
import { LabelProjector, LabelStore } from "./labels";

import type { Quality } from "./quality";
export type { Quality };

/** The shared helpers one scene needs: effects bus, DOM labels, arm hover. */
export interface SceneKit {
  fx: FxBus;
  labels: LabelStore;
  hover: HoverState;
}

export function useSceneKit(): SceneKit {
  const kit = useMemo(
    () => ({ fx: new FxBus(), labels: new LabelStore(), hover: createHoverState() }),
    [],
  );
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      kit.fx.reducedMotion = media.matches;
    };
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, [kit]);
  return kit;
}

interface Props {
  kit: SceneKit;
  quality: Quality;
  /** Called once the frame rate stays too low */
  onSlow: () => void;
  palette: Palette;
  species: Species;
  /** Camera distance multiplier for the octopus on stage */
  distanceScale?: number;
  /** Wide shot for the comparison lineup */
  lineup?: boolean;
  /** Drag-to-orbit camera. Off where the page itself needs to scroll. */
  orbit?: boolean;
  /** Landing-page framing: octopus centred, pulled back on phones */
  hero?: boolean;
  /** Text alternative for the picture (the task list is the real interface) */
  label?: string;
  children: ReactNode;
}

/** The underwater stage: canvas, camera, lights, effects. Octopuses go inside. */
export function SceneCanvas({
  kit,
  quality,
  onSlow,
  palette,
  species,
  distanceScale = 1,
  lineup = false,
  orbit = true,
  hero = false,
  label = "An octopus swimming underwater. Use the task list to play.",
  children,
}: Props) {
  const { fx, labels, hover } = kit;
  const pointerDown = useRef({ x: 0, y: 0 });

  return (
    <div className="h-full w-full" role="img" aria-label={label}>
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
          <PerformanceMonitor onDecline={onSlow} />
          <FxDriver fx={fx} />
          <ShakeGroup fx={fx}>
            <Underwater quality={quality} fogDensity={lineup ? 0.011 : 0.055} />
            {children}
            <FxLayer fx={fx} palette={palette} species={species} />
          </ShakeGroup>
          {orbit && (
            <OrbitControls
              makeDefault
              enablePan={false}
              enableDamping
              minDistance={3.5}
              maxDistance={lineup ? 90 : 18}
              minPolarAngle={0.5}
              maxPolarAngle={1.5}
            />
          )}
          <FitCamera
            distanceScale={distanceScale}
            lineup={lineup}
            centered={hero}
            portraitScale={hero ? 1.1 : 1}
          />
          <LabelProjector store={labels} />
          {quality === "high" && <Effects />}
        </Suspense>
      </Canvas>
    </div>
  );
}
