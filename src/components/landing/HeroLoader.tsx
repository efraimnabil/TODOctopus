"use client";

import dynamic from "next/dynamic";
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

export function HeroLoader() {
  return <HeroScene />;
}
