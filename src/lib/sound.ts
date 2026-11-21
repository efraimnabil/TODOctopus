/**
 * Game sounds, synthesised with Web Audio (no audio files to download), plus
 * a short buzz on phones. One mute switch covers both. The preference is kept
 * in localStorage; sound starts on after the first tap, as browsers require.
 */
import type { GameEvent } from "@/game/rules";

export type SoundName = "grow" | "slash" | "squish" | "ink" | "death" | "retract" | "unlock";

const KEY = "todoctopus:muted";

let context: AudioContext | null = null;
let noise: AudioBuffer | null = null;
let muted: boolean | null = null;
const listeners = new Set<() => void>();

function readMuted(): boolean {
  try {
    return window.localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

export function isMuted(): boolean {
  if (muted === null) muted = typeof window === "undefined" ? false : readMuted();
  return muted;
}

export function setMuted(value: boolean): void {
  muted = value;
  try {
    window.localStorage.setItem(KEY, value ? "1" : "0");
  } catch {
    // Private mode: the choice just lasts for this visit.
  }
  listeners.forEach((fn) => fn());
}

/** For useSyncExternalStore */
export function subscribeMuted(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function audio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!context) {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    context = new Ctor();
  }
  if (context.state === "suspended") void context.resume();
  return context;
}

function noiseBuffer(ctx: AudioContext): AudioBuffer {
  if (!noise) {
    noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const data = noise.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }
  return noise;
}

/** A tone gliding from one pitch to another, with a quick fade in and out. */
function tone(
  ctx: AudioContext,
  at: number,
  type: OscillatorType,
  from: number,
  to: number,
  length: number,
  volume: number,
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(from, at);
  osc.frequency.exponentialRampToValueAtTime(to, at + length);
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(volume, at + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + length);
  osc.connect(gain).connect(ctx.destination);
  osc.start(at);
  osc.stop(at + length + 0.02);
}

/** A burst of filtered noise whose cutoff sweeps from one value to another. */
function hiss(
  ctx: AudioContext,
  at: number,
  filter: BiquadFilterType,
  from: number,
  to: number,
  length: number,
  volume: number,
) {
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer(ctx);
  const f = ctx.createBiquadFilter();
  f.type = filter;
  f.frequency.setValueAtTime(from, at);
  f.frequency.exponentialRampToValueAtTime(to, at + length);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(volume, at);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + length);
  src.connect(f).connect(gain).connect(ctx.destination);
  src.start(at);
  src.stop(at + length + 0.02);
}

const recipes: Record<SoundName, (ctx: AudioContext, t: number) => void> = {
  grow: (ctx, t) => {
    tone(ctx, t, "sine", 220, 520, 0.22, 0.12);
    tone(ctx, t + 0.07, "sine", 330, 660, 0.18, 0.07);
  },
  slash: (ctx, t) => {
    hiss(ctx, t, "highpass", 1200, 7000, 0.16, 0.35);
    tone(ctx, t, "sawtooth", 900, 160, 0.14, 0.05);
  },
  squish: (ctx, t) => {
    tone(ctx, t + 0.05, "sine", 190, 55, 0.24, 0.3);
    hiss(ctx, t + 0.05, "lowpass", 900, 150, 0.2, 0.12);
  },
  ink: (ctx, t) => {
    hiss(ctx, t + 0.04, "lowpass", 600, 80, 0.7, 0.22);
  },
  death: (ctx, t) => {
    tone(ctx, t, "sine", 320, 38, 1.5, 0.28);
    tone(ctx, t + 0.02, "triangle", 160, 30, 1.6, 0.15);
    hiss(ctx, t, "lowpass", 1400, 70, 1.4, 0.2);
  },
  unlock: (ctx, t) => {
    [523, 659, 784, 1047].forEach((f, i) => tone(ctx, t + i * 0.09, "triangle", f, f * 1.01, 0.28, 0.1));
  },
  retract: (ctx, t) => {
    tone(ctx, t, "sine", 480, 160, 0.2, 0.09);
  },
};

export function play(name: SoundName): void {
  if (isMuted()) return;
  const ctx = audio();
  if (!ctx) return;
  recipes[name](ctx, ctx.currentTime);
}

/** A short buzz (Android; iOS Safari ignores it). */
export function buzz(pattern: number | number[]): void {
  if (isMuted() || typeof navigator === "undefined" || !("vibrate" in navigator)) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  navigator.vibrate(pattern);
}

/** Sound and haptics for what just happened in the game. */
export function reactToGameEvents(events: GameEvent[]): void {
  for (const e of events) {
    if (e.type === "spawned" || e.type === "grew") play("grow");
    else if (e.type === "removed") play("retract");
    else if (e.type === "cut") {
      play("slash");
      play("squish");
      play("ink");
      buzz(40);
    } else if (e.type === "defeated") {
      play("death");
      buzz([60, 40, 120]);
    }
  }
}
