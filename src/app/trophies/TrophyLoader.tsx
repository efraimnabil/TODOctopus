"use client";

import dynamic from "next/dynamic";

// The saved game is read in the browser.
const TrophyRoom = dynamic(() => import("@/components/game/TrophyRoom"), {
  ssr: false,
  loading: () => (
    <div className="grid h-dvh place-items-center">
      <p className="animate-pulse font-display text-2xl tracking-widest text-brand-gradient">
        Polishing the trophies…
      </p>
    </div>
  ),
});

export function TrophyLoader() {
  return <TrophyRoom />;
}
