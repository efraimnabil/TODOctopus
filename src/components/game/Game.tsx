"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useFocusTrap } from "@/lib/useFocusTrap";
import { computeStats, livingOctopuses, tentaclesOf } from "@/game/rules";
import type { Octopus } from "@/game/types";
import GameScene from "@/three/GameScene";
import { detectQuality } from "@/three/quality";
import type { Quality } from "@/three/SceneCanvas";
import {
  SPECIES,
  SPECIES_LIST,
  loadSpeciesChoice,
  saveSpeciesChoice,
  type SpeciesId,
} from "@/three/octopus/species";
import { SoundToggle } from "../SoundToggle";
import { GameProvider, useGame } from "./GameProvider";
import { AccountMenu } from "./AccountMenu";
import { TaskPanel } from "./TaskPanel";

export default function Game() {
  return (
    <GameProvider>
      <GameScreen />
    </GameProvider>
  );
}

function GameScreen() {
  const ready = useGame((s) => s.status === "ready");
  const [quality, setQuality] = useState<Quality>(detectQuality);
  const [showLabels, setShowLabels] = useState(true);
  const [speciesId, setSpeciesId] = useState<SpeciesId>(loadSpeciesChoice);
  useKeyboard();

  return (
    <main id="main" className="relative h-dvh w-full overflow-hidden bg-abyss">
      <GameScene
        species={SPECIES[speciesId]}
        quality={quality}
        onSlow={() => setQuality("low")}
        showLabels={showLabels}
      />
      <Header />
      {ready && (
        <>
          <EmptySea />
          <AccountMenu />
          <TaskPanel
            footer={
              <>
                <label className="flex items-center gap-1.5 text-foam/50">
                  <span className="hidden sm:inline">Body</span>
                  <select
                    aria-label="Body shape"
                    value={speciesId}
                    onChange={(e) => {
                      const id = e.target.value as SpeciesId;
                      setSpeciesId(id);
                      saveSpeciesChoice(id);
                    }}
                    className="rounded-full border border-white/15 bg-abyss/60 px-2 py-0.5 text-foam outline-none"
                  >
                    {SPECIES_LIST.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </label>
                <SoundToggle />
                <button
                  onClick={() => setShowLabels((v) => !v)}
                  className="rounded-full px-2 py-0.5 text-foam/60 hover:bg-white/10"
                >
                  Labels: {showLabels ? "on" : "off"}
                </button>
                <button
                  onClick={() => setQuality((q) => (q === "high" ? "low" : "high"))}
                  className="rounded-full px-2 py-0.5 text-foam/60 hover:bg-white/10"
                >
                  Quality: {quality}
                </button>
              </>
            }
          />
          <DefeatCard />
          <Toast />
          <LiveAnnouncer />
          <p className="pointer-events-none absolute bottom-5 left-1/2 hidden -translate-x-1/2 text-sm text-foam/50 lg:block">
            Click or swipe a tentacle to slash it · drag to look around · ← → switch octopus
          </p>
        </>
      )}
    </main>
  );
}

/** Screen-reader narration of the 3D scene's events. */
function LiveAnnouncer() {
  const text = useGame((s) => s.announcement);
  return (
    <p role="status" aria-live="polite" className="sr-only">
      {text}
    </p>
  );
}

function Header() {
  const game = useGame((s) => s.game);
  const minute = useSyncExternalStore(subscribeMinute, currentMinute, currentMinute);
  const stats = useMemo(() => computeStats(game, minute * 60_000), [game, minute]);
  return (
    <header className="pointer-events-none absolute top-0 left-0 p-4 md:p-6">
      <Link
        href="/"
        className="pointer-events-auto font-display text-2xl tracking-widest text-brand-gradient md:text-3xl"
      >
        TODOctopus
      </Link>
      <p className="text-xs tracking-[0.2em] text-foam/55 uppercase">
        <Link href="/trophies" className="pointer-events-auto hover:text-foam" title="Trophy room">
          {stats.killed} defeated
        </Link>
        {` · ${stats.finished} slashed`}
        {stats.streak > 0 && ` · ${stats.streak}-day streak`}
      </p>
    </header>
  );
}

/** A clock that ticks once a minute (the streak depends on what day it is). */
const subscribeMinute = (cb: () => void) => {
  const t = window.setInterval(cb, 15_000);
  return () => window.clearInterval(t);
};
const currentMinute = () => Math.floor(Date.now() / 60_000);

function EmptySea() {
  const empty = useGame((s) => s.activeId === null);
  if (!empty) return null;
  return (
    <div className="pointer-events-none absolute inset-x-0 top-[22%] px-6 text-center md:top-[38%] md:pl-96">
      <p className="text-2xl text-foam/85 md:text-3xl">The sea is quiet…</p>
      <p className="mt-2 text-foam/55">Add a task to summon an octopus.</p>
    </div>
  );
}

function DefeatCard() {
  const id = useGame((s) => s.defeatedCard);
  const game = useGame((s) => s.game);
  const octopus = game.octopuses.find((o) => o.id === id);
  if (!octopus) return null;
  return <DefeatDialog octopus={octopus} />;
}

function DefeatDialog({ octopus }: { octopus: Octopus }) {
  const game = useGame((s) => s.game);
  const dismiss = useGame((s) => s.dismissDefeat);
  const panel = useRef<HTMLDivElement>(null);
  useFocusTrap(panel);
  const held = tentaclesOf(game, octopus.id);
  const more = livingOctopuses(game).length > 0;
  return (
    <div className="absolute inset-0 grid place-items-center bg-abyss/40 p-4">
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="defeat-title"
        className="glass w-full max-w-sm rounded-3xl p-8 text-center"
      >
        <p className="text-sm tracking-[0.3em] text-foam/60 uppercase">Octopus defeated</p>
        <h2 id="defeat-title" className="mt-2 text-3xl">
          <span className="text-brand-gradient">{octopus.name}</span> is gone
        </h2>
        <ul className="mt-4 max-h-40 space-y-0.5 overflow-y-auto text-sm text-foam/60">
          {held.map((t) => (
            <li key={t.id} className="truncate line-through">
              {t.title}
            </li>
          ))}
        </ul>
        <button
          onClick={() => {
            dismiss();
            if (!more) document.getElementById("new-task")?.focus();
          }}
          autoFocus
          className="mt-6 rounded-full bg-brand-gradient px-6 py-2.5 text-lg text-white transition-transform hover:scale-105 active:scale-95"
        >
          {more ? "Next octopus" : "Keep going"}
        </button>
      </div>
    </div>
  );
}

function Toast() {
  const error = useGame((s) => s.error);
  const clear = useGame((s) => s.clearError);
  useEffect(() => {
    if (!error) return;
    const t = window.setTimeout(clear, 3500);
    return () => window.clearTimeout(t);
  }, [error, clear]);
  if (!error) return null;
  return (
    <div
      role="status"
      className="glass absolute top-4 left-1/2 -translate-x-1/2 rounded-full px-4 py-2 text-sm text-foam"
    >
      {error}
    </div>
  );
}

/** ← → switch octopus, Esc clears the selection (when not typing). */
function useKeyboard() {
  const step = useGame((s) => s.step);
  const select = useGame((s) => s.select);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (el.closest("input, textarea, select, [contenteditable]")) return;
      if (e.key === "ArrowLeft") step(-1);
      else if (e.key === "ArrowRight") step(1);
      else if (e.key === "Escape") select(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [step, select]);
}
