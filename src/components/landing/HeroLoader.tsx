"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import Image from "next/image";

// WebGL is browser-only. While it loads, the old flat octopus holds the spot.
const HeroScene = dynamic(() => import("@/three/HeroScene"), {
  ssr: false,
  loading: () => <HeroPoster />,
});

export function HeroPoster() {
  return (
    <div className="absolute inset-0 grid place-items-center">
      <Image
        src="/brand/octopus.svg"
        alt=""
        width={253}
        height={235}
        priority
        unoptimized
        className="h-auto w-44 animate-pulse opacity-70 md:w-60"
      />
    </div>
  );
}

/**
 * The poster shows first; the 3D scene (a large script) starts once the page
 * has painted and the browser is idle, so the headline and the button are
 * usable straight away instead of waiting on WebGL.
 */
export function HeroLoader() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const start = () => setReady(true);
    if ("requestIdleCallback" in window) {
      const id = window.requestIdleCallback(start, { timeout: 2500 });
      return () => window.cancelIdleCallback(id);
    }
    // Safari has no requestIdleCallback.
    const id = setTimeout(start, 1200);
    return () => clearTimeout(id);
  }, []);
  return ready ? <HeroScene /> : <HeroPoster />;
}
