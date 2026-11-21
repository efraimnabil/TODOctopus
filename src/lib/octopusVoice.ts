"use client";

import type { GameEvent } from "@/game/rules";
import { DEFAULT_TONE, isTone, lineFor, momentOf, type Tone } from "./personality";

const TONE_KEY = "todoctopus:tone";
const BUBBLE_MS = 3500;

const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

export const subscribeVoice = (l: () => void) => {
  listeners.add(l);
  window.addEventListener("storage", l);
  return () => {
    listeners.delete(l);
    window.removeEventListener("storage", l);
  };
};

// ── Tone (remembered between visits) ───────────────────────────────────────

export function getTone(): Tone {
  try {
    const v = localStorage.getItem(TONE_KEY);
    return isTone(v) ? v : DEFAULT_TONE;
  } catch {
    return DEFAULT_TONE;
  }
}

export function setTone(tone: Tone): void {
  try {
    localStorage.setItem(TONE_KEY, tone);
  } catch {
    // Private mode: the choice lasts until reload only.
  }
  if (tone === "off") say(null);
  notify();
}

// ── The speech bubble ──────────────────────────────────────────────────────

export interface Bubble {
  id: number;
  text: string;
  /** Read out by screen readers (advice the player asked for), not just chatter */
  announce: boolean;
}

let bubble: Bubble | null = null;
let timer: ReturnType<typeof setTimeout> | undefined;
let nextId = 1;

export const getBubble = () => bubble;

export function say(text: string | null, announce = false): void {
  clearTimeout(timer);
  bubble = text ? { id: nextId++, text, announce } : null;
  if (text) timer = setTimeout(() => say(null), BUBBLE_MS);
  notify();
}

/** Hooked into the game's event stream: the octopus reacts out loud. */
export function sayForEvents(events: GameEvent[]): void {
  const moment = momentOf(events);
  // A defeat gets its own words in the defeat card.
  if (!moment || moment.moment === "defeated") return;
  const line = lineFor(getTone(), moment, Math.random());
  if (line) say(line);
}

// ── AI lines are a treat, not a flood ──────────────────────────────────────

const VOICE_CREDIT_KEY = "todoctopus:voice-day";
const VOICE_CREDITS_PER_DAY = 3;

/** True while today's allowance of AI-written lines isn't used up (and uses one). */
export function takeVoiceCredit(now = new Date()): boolean {
  const p = (n: number) => String(n).padStart(2, "0");
  const today = `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}`;
  try {
    const [day, n] = (localStorage.getItem(VOICE_CREDIT_KEY) ?? "").split(":");
    const used = day === today ? Number(n) || 0 : 0;
    if (used >= VOICE_CREDITS_PER_DAY) return false;
    localStorage.setItem(VOICE_CREDIT_KEY, `${today}:${used + 1}`);
    return true;
  } catch {
    return false;
  }
}
