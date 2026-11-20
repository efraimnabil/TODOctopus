"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Octopus, Tentacle } from "@/game/scene";
import { play, buzz } from "@/lib/sound";
import { createPalette } from "./octopus/constants";
import { OctopusRig } from "./octopus/OctopusRig";
import { DEFAULT_TUNING, type Tuning } from "./octopus/shared";
import { DEFAULT_SPECIES, SPECIES } from "./octopus/species";
import { TentacleLabels } from "./labels";
import { detectQuality } from "./quality";
import { SceneBoundary } from "./SceneBoundary";
import { SceneCanvas, useSceneKit, type Quality } from "./SceneCanvas";

const SAMPLE_TASKS = [
  "Reply to emails",
  "Book the dentist",
  "Finish the report",
  "Buy groceries",
  "Call mom",
];

function freshOctopus(round: number): Octopus {
  return {
    id: `hero-${round}`,
    name: "Hero",
    seed: 40 + round * 17,
    status: "alive",
    tentacles: SAMPLE_TASKS.map((title, i): Tentacle => ({
      id: `hero-${round}-${i}`,
      slot: i,
      title,
      priority: ((i % 3) + 1) as 1 | 2 | 3,
      status: "alive",
    })),
  };
}

/**
 * The landing page's octopus: alive, watching the cursor, and slashable.
 * It is a toy copy (nothing is saved); when it's beaten, a new one swims in.
 */
export default function HeroScene() {
  const kit = useSceneKit();
  const species = SPECIES[DEFAULT_SPECIES];
  const [quality, setQuality] = useState<Quality>(detectQuality);
  const [round, setRound] = useState(0);
  const [slashed, setSlashed] = useState<ReadonlyMap<string, number>>(new Map());
  const [dying, setDying] = useState(false);
  const tuning = useRef<Tuning>({ ...DEFAULT_TUNING, ...species.tuning });

  const base = useMemo(() => freshOctopus(round), [round]);
  const model = useMemo<Octopus>(
    () => ({
      ...base,
      status: dying ? "dying" : "alive",
      tentacles: base.tentacles.map((t) =>
        slashed.has(t.id) ? { ...t, status: "cut", cutIndex: slashed.get(t.id) } : t,
      ),
    }),
    [base, slashed, dying],
  );
  const palette = useMemo(() => createPalette(model.seed, species), [model.seed, species]);

  const cut = useCallback((id: string, cutIndex: number) => {
    play("slash");
    play("squish");
    play("ink");
    buzz(40);
    setSlashed((prev) => {
      const next = new Map(prev).set(id, cutIndex);
      if (next.size === SAMPLE_TASKS.length) {
        play("death");
        setDying(true);
      }
      return next;
    });
  }, []);

  // A beaten octopus is replaced a moment later.
  const dead = useCallback(() => {
    window.setTimeout(() => {
      setSlashed(new Map());
      setDying(false);
      setRound((r) => r + 1);
    }, 900);
  }, []);
  const noop = useCallback(() => {}, []);

  useEffect(() => {
    tuning.current = { ...DEFAULT_TUNING, ...species.tuning };
  }, [species]);

  return (
    <>
      <SceneBoundary>
        <SceneCanvas
          kit={kit}
          quality={quality}
          onSlow={() => setQuality("low")}
          palette={palette}
          species={species}
          distanceScale={species.view * 1.05}
          orbit={false}
          hero
        >
          <OctopusRig
            key={model.id}
            model={model}
            species={species}
            fx={kit.fx}
            tuning={tuning}
            labels={kit.labels}
            hover={kit.hover}
            onCut={cut}
            onRetracted={noop}
            onDead={dead}
          />
        </SceneCanvas>
      </SceneBoundary>
      {model.status === "alive" && (
        <TentacleLabels
          store={kit.labels}
          tentacles={model.tentacles.filter((t) => t.status === "alive")}
        />
      )}
    </>
  );
}
