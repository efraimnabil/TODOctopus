"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useFocusTrap } from "@/lib/useFocusTrap";
import { isMuted, play, setMuted } from "@/lib/sound";
import { sharePath, slashedText } from "@/lib/share";
import { useNow } from "@/lib/useNow";
import { computeStats, livingOctopuses, tentaclesOf } from "@/game/rules";
import { sortTasks, stepSelection } from "@/game/view";
import type { Octopus } from "@/game/types";
import GameScene from "@/three/GameScene";
import { detectQuality } from "@/three/quality";
import type { Quality } from "@/three/SceneCanvas";
import {
  loadSpeciesPreference,
  resolveSpecies,
  saveSpeciesChoice,
  type SpeciesChoice,
} from "@/three/octopus/species";
import { ShareButton } from "../ShareButton";
import { GameProvider, useGame, useGameStore } from "./GameProvider";
import { AccountMenu } from "./AccountMenu";
import { LastWords } from "./LastWords";
import { OctopusSpeech } from "./OctopusSpeech";
import { SettingsMenu } from "./SettingsMenu";
import { whatFirst } from "./whatFirst";
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
  const [speciesId, setSpeciesId] = useState<SpeciesChoice>(loadSpeciesPreference);
  const seed = useGame((s) => s.game.octopuses.find((o) => o.id === s.activeId)?.seed ?? 0);
  const [help, setHelp] = useState(false);
  const toggleHelp = useCallback(() => setHelp((v) => !v), []);
  useKeyboard(toggleHelp);

  return (
    <main id="main" className="relative h-dvh w-full overflow-hidden bg-abyss">
      <GameScene
        species={resolveSpecies(speciesId, seed)}
        quality={quality}
        onSlow={() => setQuality("low")}
        showLabels={showLabels}
      />
      <Header />
      {ready && (
        <>
          <EmptySea />
          <AccountMenu
            before={
              <SettingsMenu
                species={speciesId}
                onSpecies={(id) => {
                  setSpeciesId(id);
                  saveSpeciesChoice(id);
                }}
                showLabels={showLabels}
                onLabels={setShowLabels}
                quality={quality}
                onQuality={setQuality}
                onShortcuts={() => setHelp(true)}
              />
            }
          />
          <TaskPanel />
          <OctopusSpeech />
          <DefeatCard />
          <Toast />
          <UnlockToast />
          <LiveAnnouncer />
          {help && <ShortcutHelp onClose={() => setHelp(false)} />}
          <p className="pointer-events-none absolute bottom-5 left-1/2 hidden -translate-x-1/2 text-sm text-foam/50 lg:block">
            Click or swipe a tentacle to slash it · drag to look around · ← → switch octopus · ? shortcuts
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
  const now = useNow();
  const stats = useMemo(() => computeStats(game, now), [game, now]);
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
  const now = useNow();
  const stats = useMemo(() => computeStats(game, now), [game, now]);
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
        <LastWords name={octopus.name} titles={held.map((t) => t.title)} />
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
        <ShareButton
          className="mt-3 ml-2"
          text={`I just defeated ${octopus.name} on TODOctopus: ${slashedText(held.length)}. 🐙`}
          path={sharePath({ name: octopus.name, slashed: held.length, streak: stats.streak })}
        />
      </div>
    </div>
  );
}

/** A brief banner when an achievement is earned. */
function UnlockToast() {
  const unlocked = useGame((s) => s.unlocked);
  const clear = useGame((s) => s.clearUnlocked);
  useEffect(() => {
    if (!unlocked) return;
    play("unlock");
    const t = window.setTimeout(clear, 4500);
    return () => window.clearTimeout(t);
  }, [unlocked, clear]);
  if (!unlocked) return null;
  return (
    <Link
      href="/trophies"
      className="glass absolute top-16 left-1/2 -translate-x-1/2 rounded-full px-5 py-2 text-sm text-foam"
    >
      <span className="text-brand-gradient">Achievement unlocked</span> · {unlocked}
    </Link>
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

/**
 * Keyboard play (when not typing): ← → switch octopus, J/K pick a task,
 * S slash the picked task, N new task, M mute, ? help, Esc clear.
 */
function useKeyboard(toggleHelp: () => void) {
  const store = useGameStore();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (el.closest("input, textarea, select, [contenteditable], [role=dialog]")) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const s = store.getState();
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      if (key === "ArrowLeft") s.step(-1);
      else if (key === "ArrowRight") s.step(1);
      else if (key === "Escape") s.select(null);
      else if (key === "j" || key === "k") {
        const open = sortTasks(
          s.game.tasks.filter((t) => t.octopusId === s.activeId && t.status === "open"),
          "priority",
        );
        s.select(stepSelection(open, s.selectedId, key === "j" ? 1 : -1));
      } else if (key === "w") {
        whatFirst(store);
      } else if (key === "s") {
        if (s.selectedId) s.completeTask(s.selectedId);
      } else if (key === "n") {
        e.preventDefault();
        document.getElementById("new-task")?.focus();
      } else if (key === "m") setMuted(!isMuted());
      else if (key === "?") toggleHelp();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [store, toggleHelp]);
}

const SHORTCUTS: [string, string][] = [
  ["← →", "Switch octopus"],
  ["J / K", "Pick the next / previous task"],
  ["W", "What should I do first?"],
  ["S", "Slash the picked task"],
  ["N", "New task"],
  ["M", "Mute or unmute"],
  ["Esc", "Clear the pick"],
  ["?", "This help"],
];

function ShortcutHelp({ onClose }: { onClose: () => void }) {
  const panel = useRef<HTMLDivElement>(null);
  useFocusTrap(panel);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => (e.key === "Escape" || e.key === "?") && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div
      className="absolute inset-0 z-10 grid place-items-center bg-abyss/60 p-4"
      onMouseDown={(e) => {
        if (!panel.current?.contains(e.target as Node)) onClose();
      }}
    >
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="keys-title"
        className="glass w-full max-w-sm rounded-3xl p-6"
      >
        <h2 id="keys-title" className="text-2xl">
          Keyboard shortcuts
        </h2>
        <dl className="mt-4 space-y-2 text-sm">
          {SHORTCUTS.map(([keys, what]) => (
            <div key={keys} className="flex items-center justify-between gap-4">
              <dt>
                <kbd className="rounded-md border border-white/20 bg-white/10 px-2 py-0.5 text-xs">
                  {keys}
                </kbd>
              </dt>
              <dd className="text-foam/75">{what}</dd>
            </div>
          ))}
        </dl>
        <button
          onClick={onClose}
          className="mt-6 w-full rounded-full bg-white/10 px-4 py-2 text-foam hover:bg-white/15"
        >
          Close
        </button>
      </div>
    </div>
  );
}
