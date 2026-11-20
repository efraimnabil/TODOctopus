"use client";

import { Component, type ReactNode } from "react";
import Image from "next/image";

interface State {
  failed: boolean;
}

/**
 * If the 3D view can't start (no WebGL, a lost GPU context, a bug), show a
 * flat octopus instead and leave the rest of the page working. The task
 * list never depends on the canvas.
 */
export class SceneBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.error("3D scene failed", error);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="absolute inset-0 grid place-items-center bg-abyss" role="img" aria-label="An octopus">
        <div className="px-6 text-center">
          <Image
            src="/brand/octopus.svg"
            alt=""
            width={253}
            height={235}
            unoptimized
            className="mx-auto h-auto w-40 opacity-80"
          />
          <p className="mt-4 text-sm text-foam/60">
            The 3D view isn&rsquo;t available on this device. The game still works from the list.
          </p>
        </div>
      </div>
    );
  }
}
