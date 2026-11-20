"use client";

import dynamic from "next/dynamic";

// WebGL and the saved game only exist in the browser, so nothing here is
// server-rendered.
const Game = dynamic(() => import("@/components/game/Game"), {
  ssr: false,
  loading: () => (
    <div className="grid h-dvh place-items-center bg-abyss">
      <p className="animate-pulse font-display text-2xl tracking-widest text-brand-gradient">
        Summoning the octopus…
      </p>
    </div>
  ),
});

export function PlayLoader() {
  return <Game />;
}
