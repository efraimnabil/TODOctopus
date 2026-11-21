"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { useGame, useGameStore } from "@/components/game/GameProvider";
import { toScene } from "@/game/store";
import { useNow } from "@/lib/useNow";
import { createPalette } from "./octopus/constants";
import { OctopusRig } from "./octopus/OctopusRig";
import { DEFAULT_TUNING, type Tuning } from "./octopus/shared";
import type { Species } from "./octopus/species";
import { TentacleLabels } from "./labels";
import { SceneBoundary } from "./SceneBoundary";
import { SceneCanvas, useSceneKit, type Quality } from "./SceneCanvas";

interface Props {
  species: Species;
  quality: Quality;
  onSlow: () => void;
  showLabels: boolean;
}

/** The octopus on stage, drawn from the game store. */
export default function GameScene({ species, quality, onSlow, showLabels }: Props) {
  const store = useGameStore();
  const kit = useSceneKit();
  const { fx, labels, hover } = kit;

  const activeId = useGame((s) => s.activeId);
  const game = useGame((s) => s.game);
  const dying = useGame((s) => s.dying);
  const retracting = useGame((s) => s.retracting);
  const selectedId = useGame((s) => s.selectedId);
  const now = useNow();
  const model = useMemo(
    () => (activeId ? toScene({ game, dying, retracting }, activeId, now) : null),
    [activeId, game, dying, retracting, now],
  );

  const tuning = useRef<Tuning>({ ...DEFAULT_TUNING, ...species.tuning });
  useEffect(() => {
    tuning.current = { ...DEFAULT_TUNING, ...species.tuning };
  }, [species]);

  useEffect(() => {
    hover.onChange = (id) => store.getState().hover(id);
    return () => {
      hover.onChange = null;
    };
  }, [hover, store]);

  const palette = useMemo(() => createPalette(model?.seed ?? 0, species), [model?.seed, species]);

  const cut = useCallback(
    (id: string, cutIndex: number) => store.getState().completeTask(id, cutIndex),
    [store],
  );
  const retracted = useCallback((id: string) => store.getState().retracted(id), [store]);
  const modelId = model?.id;
  const dead = useCallback(() => {
    if (modelId) store.getState().deathFinished(modelId);
  }, [store, modelId]);

  return (
    <>
      <SceneBoundary>
        <SceneCanvas
          kit={kit}
          quality={quality}
          onSlow={onSlow}
          palette={palette}
          species={species}
          distanceScale={species.view}
        >
          {model && (
            <OctopusRig
              key={`${model.id}-${species.id}`}
              model={model}
              species={species}
              fx={fx}
              tuning={tuning}
              labels={showLabels ? labels : null}
              hover={hover}
              selectedId={selectedId}
              onCut={cut}
              onRetracted={retracted}
              onDead={dead}
            />
          )}
        </SceneCanvas>
      </SceneBoundary>
      {showLabels && model?.status === "alive" && (
        <TentacleLabels
          store={labels}
          tentacles={model.tentacles.filter((t) => t.status === "alive")}
          selectedId={selectedId}
        />
      )}
    </>
  );
}
