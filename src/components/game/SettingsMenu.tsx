"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { getTone, setTone, subscribeVoice } from "@/lib/octopusVoice";
import { DEFAULT_TONE, TONES, isTone } from "@/lib/personality";
import { isMuted, setMuted, subscribeMuted } from "@/lib/sound";
import type { Quality } from "@/three/SceneCanvas";
import { SPECIES_LIST, isSpeciesChoice, type SpeciesChoice } from "@/three/octopus/species";
import { GearIcon } from "./icons";

const select =
  "w-full rounded-xl bg-abyss/60 px-3 py-2 text-sm text-foam ring-1 ring-white/12 outline-none focus:ring-2 focus:ring-brand-pink/60";

/** Look-and-feel options, tucked behind a gear so the task list stays clean. */
export function SettingsMenu({
  species,
  onSpecies,
  showLabels,
  onLabels,
  quality,
  onQuality,
  onShortcuts,
}: {
  species: SpeciesChoice;
  onSpecies: (id: SpeciesChoice) => void;
  showLabels: boolean;
  onLabels: (on: boolean) => void;
  quality: Quality;
  onQuality: (q: Quality) => void;
  onShortcuts: () => void;
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const tone = useSyncExternalStore(subscribeVoice, getTone, () => DEFAULT_TONE);
  const muted = useSyncExternalStore(subscribeMuted, isMuted, () => false);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        root.current?.querySelector<HTMLButtonElement>("button")?.focus();
      }
    };
    document.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={root} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label="Settings"
        title="Settings"
        className={`glass grid size-10 place-items-center rounded-full text-foam/80 transition hover:text-foam ${
          open ? "ring-2 ring-brand-pink/60" : ""
        }`}
      >
        <GearIcon size={18} />
      </button>
      {open && (
        <div
          role="group"
          aria-label="Settings"
          className="glass absolute top-12 right-0 z-20 w-72 space-y-4 rounded-3xl p-4 text-sm shadow-2xl"
        >
          <Field label="Octopus">
            <select
              aria-label="Body shape"
              value={species}
              onChange={(e) => isSpeciesChoice(e.target.value) && onSpecies(e.target.value)}
              className={select}
            >
              <option value="random">Surprise me</option>
              {SPECIES_LIST.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Personality">
            <select
              aria-label="Octopus personality"
              value={tone}
              onChange={(e) => isTone(e.target.value) && setTone(e.target.value)}
              className={select}
            >
              {TONES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </Field>

          <div className="space-y-1 border-t border-white/10 pt-3">
            <Switch label="Sound" checked={!muted} onChange={(on) => setMuted(!on)} />
            <Switch label="Labels on tentacles" checked={showLabels} onChange={onLabels} />
            <Switch
              label="High quality graphics"
              checked={quality === "high"}
              onChange={(on) => onQuality(on ? "high" : "low")}
            />
          </div>

          <div className="flex items-center justify-between border-t border-white/10 pt-3 text-xs">
            <button
              onClick={() => {
                setOpen(false);
                onShortcuts();
              }}
              className="flex items-center gap-1.5 text-foam/60 hover:text-foam"
            >
              <kbd className="rounded border border-white/20 bg-white/10 px-1.5">?</kbd>
              Keyboard shortcuts
            </button>
            <Link href="/trophies" className="text-foam/60 hover:text-foam">
              Trophy room →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <p className="px-1 text-[0.68rem] tracking-[0.15em] text-foam/50 uppercase">{label}</p>
      {children}
    </div>
  );
}

function Switch({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (on: boolean) => void;
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between rounded-xl px-1 py-1.5 text-left text-foam/85 hover:text-foam"
    >
      {label}
      <span
        className={`relative h-5 w-9 shrink-0 rounded-full transition ${
          checked ? "bg-brand-gradient" : "bg-white/15"
        }`}
      >
        <span
          className={`absolute top-0.5 size-4 rounded-full bg-white shadow transition-all ${
            checked ? "left-4.5" : "left-0.5"
          }`}
        />
      </span>
    </button>
  );
}
