"use client";

import dynamic from "next/dynamic";

// WebGL only exists in the browser, so the scene is never server-rendered.
const OctopusLab = dynamic(() => import("@/three/OctopusLab"), {
  ssr: false,
  loading: () => (
    <div className="grid h-dvh place-items-center bg-abyss">
      <p className="animate-pulse font-display text-2xl tracking-widest text-brand-gradient">
        Summoning the octopus…
      </p>
    </div>
  ),
});

export function LabLoader() {
  return <OctopusLab />;
}
