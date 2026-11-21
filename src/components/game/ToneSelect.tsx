"use client";

import { useSyncExternalStore } from "react";
import { getTone, setTone, subscribeVoice } from "@/lib/octopusVoice";
import { DEFAULT_TONE, TONES, isTone } from "@/lib/personality";

/** How talkative (and how cheeky) the octopus is. */
export function ToneSelect() {
  const tone = useSyncExternalStore(subscribeVoice, getTone, () => DEFAULT_TONE);
  return (
    <label className="flex items-center gap-1.5 text-foam/50">
      <span className="hidden sm:inline">Voice</span>
      <select
        aria-label="Octopus personality"
        value={tone}
        onChange={(e) => isTone(e.target.value) && setTone(e.target.value)}
        className="rounded-full border border-white/15 bg-abyss/60 px-2 py-0.5 text-foam outline-none"
      >
        {TONES.map((t) => (
          <option key={t.id} value={t.id}>
            {t.label}
          </option>
        ))}
      </select>
    </label>
  );
}
