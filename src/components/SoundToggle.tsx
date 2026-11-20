"use client";

import { useSyncExternalStore } from "react";
import { isMuted, setMuted, subscribeMuted } from "@/lib/sound";

/** Sound and haptics on/off, remembered between visits. */
export function SoundToggle({ className = "" }: { className?: string }) {
  const muted = useSyncExternalStore(subscribeMuted, isMuted, () => false);
  return (
    <button
      onClick={() => setMuted(!muted)}
      aria-pressed={!muted}
      aria-label={muted ? "Sound off. Turn on" : "Sound on. Turn off"}
      title={muted ? "Sound off" : "Sound on"}
      className={`rounded-full px-2 py-0.5 whitespace-nowrap text-foam/60 hover:bg-white/10 hover:text-foam ${className}`}
    >
      Sound: {muted ? "off" : "on"}
    </button>
  );
}
