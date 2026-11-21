"use client";

import { useSyncExternalStore } from "react";
import { getBubble, subscribeVoice } from "@/lib/octopusVoice";

/** What the octopus says right now. Decorative: the live announcer covers screen readers. */
export function OctopusSpeech() {
  const bubble = useSyncExternalStore(subscribeVoice, getBubble, () => null);
  if (!bubble) return null;
  return (
    <p
      key={bubble.id}
      aria-hidden
      className="glass pointer-events-none absolute top-[16%] left-1/2 max-w-[min(22rem,80vw)] -translate-x-1/2 rounded-2xl px-4 py-2 text-center text-sm text-foam"
    >
      {bubble.text}
    </p>
  );
}
