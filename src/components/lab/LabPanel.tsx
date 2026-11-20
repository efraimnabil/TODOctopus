"use client";

import { useState, type SubmitEvent } from "react";
import Link from "next/link";
import { MAX_TENTACLES, freeSlot, type LabState } from "@/game/lab";
import type { Priority } from "@/game/scene";
import { PRIORITIES } from "@/components/priority";
import { SPECIES, SPECIES_LIST, type SpeciesId } from "@/three/octopus/species";


interface Props {
  state: LabState;
  view: "single" | "lineup";
  speciesId: SpeciesId;
  onPickSpecies: (id: SpeciesId) => void;
  onCompare: () => void;
  quality: "high" | "low";
  showLabels: boolean;
  onAdd: (title: string, priority: Priority) => void;
  onCut: (id: string) => void;
  onRetract: (id: string) => void;
  onKillAll: () => void;
  onSpawn: () => void;
  onToggleLabels: () => void;
  onToggleQuality: () => void;
}

export function LabPanel({
  state,
  view,
  speciesId,
  onPickSpecies,
  onCompare,
  quality,
  showLabels,
  onAdd,
  onCut,
  onRetract,
  onKillAll,
  onSpawn,
  onToggleLabels,
  onToggleQuality,
}: Props) {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<Priority>(2);
  const { octopus, kills } = state;
  const alive = octopus.status === "alive";
  const full = freeSlot(octopus) === null;
  const remaining = octopus.tentacles.filter((t) => t.status === "alive").length;
  const tentacles = [...octopus.tentacles].sort((a, b) => a.slot - b.slot);

  const submit = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAdd(title, priority);
    setTitle("");
  };

  const header = (
    <header className="pointer-events-none absolute top-0 left-0 p-4 md:p-6">
      <Link
        href="/"
        className="pointer-events-auto font-display text-2xl tracking-widest text-brand-gradient md:text-3xl"
      >
        TODOctopus
      </Link>
      <p className="text-xs tracking-[0.3em] text-foam/50 uppercase">
        Octopus Lab · {kills} defeated
      </p>
    </header>
  );

  if (view === "lineup") {
    return (
      <>
        {header}
        <div className="glass absolute right-3 bottom-3 left-3 rounded-3xl p-4 md:right-auto md:left-1/2 md:w-[56rem] md:-translate-x-1/2">
          <h2 className="text-lg">Pick a body shape</h2>
          <p className="text-sm text-foam/60">
            Tap a name above an octopus, or choose here. You can switch any time.
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-5">
            {SPECIES_LIST.map((s) => (
              <button
                key={s.id}
                onClick={() => onPickSpecies(s.id)}
                className={`rounded-2xl p-3 text-left transition hover:bg-white/10 ${
                  s.id === speciesId ? "bg-white/10 ring-1 ring-brand-pink/70" : "bg-white/5"
                }`}
              >
                <span className="flex items-center gap-2">
                  <span
                    className="size-3 shrink-0 rounded-full"
                    style={{ background: `linear-gradient(135deg, ${s.colors.skin}, ${s.colors.tip})` }}
                  />
                  <span className="text-sm text-foam">{s.name}</span>
                </span>
                <span className="mt-1 block text-xs leading-snug text-foam/55">{s.blurb}</span>
              </button>
            ))}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <header className="pointer-events-none absolute top-0 left-0 p-4 md:p-6">
        <Link
          href="/"
          className="pointer-events-auto font-display text-2xl tracking-widest text-brand-gradient md:text-3xl"
        >
          TODOctopus
        </Link>
        <p className="text-xs tracking-[0.3em] text-foam/50 uppercase">
          Octopus Lab · {kills} defeated
        </p>
      </header>

      <aside className="glass absolute right-3 bottom-3 left-3 max-h-[44dvh] overflow-y-auto rounded-3xl p-4 md:top-28 md:right-auto md:bottom-auto md:left-6 md:max-h-[calc(100dvh-9rem)] md:w-80">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="truncate text-xl">{octopus.name}</h2>
          <span className="shrink-0 text-sm text-foam/60">
            {remaining} left · {octopus.tentacles.length}/{MAX_TENTACLES}
          </span>
        </div>

        <div className="mt-2 flex items-center gap-2 text-xs">
          <label htmlFor="species" className="text-foam/50">
            Body
          </label>
          <select
            id="species"
            value={speciesId}
            onChange={(e) => onPickSpecies(e.target.value as SpeciesId)}
            className="min-w-0 flex-1 rounded-full border border-white/15 bg-abyss/60 px-2 py-1 text-foam outline-none"
          >
            {SPECIES_LIST.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <button
            onClick={onCompare}
            className="rounded-full px-2 py-1 text-foam/60 hover:bg-white/10 hover:text-foam"
            title={`Compare all body shapes (current: ${SPECIES[speciesId].name})`}
          >
            Compare all
          </button>
        </div>

        <form onSubmit={submit} className="mt-3 space-y-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={full ? "This octopus is full" : "New task → new tentacle"}
            disabled={!alive || full}
            maxLength={60}
            aria-label="Task title"
            className="w-full rounded-full border border-brand-pink/60 bg-transparent px-4 py-2 text-foam placeholder-foam/40 outline-none focus:ring-2 focus:ring-brand-pink/60 disabled:opacity-40"
          />
          <div className="flex items-center justify-between gap-2">
            <div className="flex gap-1" role="radiogroup" aria-label="Priority">
              {PRIORITIES.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  role="radio"
                  aria-checked={priority === p.value}
                  onClick={() => setPriority(p.value)}
                  className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs transition ${
                    priority === p.value ? "bg-white/15 text-foam" : "text-foam/50 hover:text-foam"
                  }`}
                >
                  <span className={`size-2 rounded-full ${p.dot}`} />
                  {p.label}
                </button>
              ))}
            </div>
            <button
              type="submit"
              disabled={!alive || full || !title.trim()}
              className="rounded-full bg-brand-gradient px-4 py-1.5 text-sm text-white transition disabled:opacity-40"
            >
              Grow
            </button>
          </div>
        </form>

        <ul className="mt-4 space-y-1.5">
          {tentacles.map((t) => {
            const dot = PRIORITIES.find((p) => p.value === t.priority)?.dot;
            const done = t.status === "cut";
            return (
              <li
                key={t.id}
                className={`flex items-center gap-2 rounded-2xl px-3 py-2 ${done ? "bg-white/3" : "bg-white/6"} ${
                  t.status === "retracting" ? "opacity-40" : ""
                }`}
              >
                <span className={`size-2 shrink-0 rounded-full ${dot}`} />
                <span className={`min-w-0 flex-1 truncate ${done ? "text-foam/60 line-through" : ""}`}>
                  {t.title}
                </span>
                {t.status === "alive" && alive && (
                  <>
                    <button
                      onClick={() => onCut(t.id)}
                      className="rounded-full bg-brand-gradient px-2.5 py-0.5 text-xs text-white"
                      title="Done: slash this tentacle"
                    >
                      Slash
                    </button>
                    <button
                      onClick={() => onRetract(t.id)}
                      className="rounded-full px-2 py-0.5 text-xs text-foam/50 hover:bg-white/10 hover:text-foam"
                      title="Delete: the tentacle retracts (no kill credit)"
                    >
                      Delete
                    </button>
                  </>
                )}
              </li>
            );
          })}
          {tentacles.length === 0 && (
            <li className="px-1 py-2 text-sm text-foam/50">No tentacles yet. Add a task to grow one.</li>
          )}
        </ul>

        <div className="mt-4 flex flex-wrap gap-2 border-t border-white/10 pt-3 text-xs">
          <button
            onClick={onKillAll}
            disabled={!alive || remaining === 0}
            className="rounded-full border border-brand-pink/60 px-3 py-1 text-foam disabled:opacity-40"
          >
            Slash them all
          </button>
          <button onClick={onToggleLabels} className="rounded-full px-3 py-1 text-foam/60 hover:bg-white/10">
            Labels: {showLabels ? "on" : "off"}
          </button>
          <button onClick={onToggleQuality} className="rounded-full px-3 py-1 text-foam/60 hover:bg-white/10">
            Quality: {quality}
          </button>
        </div>
      </aside>

      <p className="pointer-events-none absolute bottom-5 left-1/2 hidden -translate-x-1/2 text-sm text-foam/50 md:block">
        Click a tentacle to slash it · drag to look around
      </p>

      {octopus.status === "dead" && (
        <div className="absolute inset-0 grid place-items-center bg-abyss/30 p-4">
          <div className="glass max-w-sm rounded-3xl p-8 text-center">
            <p className="text-sm tracking-[0.3em] text-foam/60 uppercase">Octopus defeated</p>
            <h2 className="mt-2 text-3xl">
              <span className="text-brand-gradient">{octopus.name}</span> is gone
            </h2>
            <p className="mt-3 text-foam/70">Every tentacle slashed. Nicely done.</p>
            <button
              onClick={onSpawn}
              autoFocus
              className="mt-6 rounded-full bg-brand-gradient px-6 py-2.5 text-lg text-white transition-transform hover:scale-105 active:scale-95"
            >
              Summon the next octopus
            </button>
          </div>
        </div>
      )}
    </>
  );
}
