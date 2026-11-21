"use client";

import { useState } from "react";

/**
 * Shares a line of text with the system share sheet, or copies it. `path`
 * is the page to link to (it can carry a share card); the home page by default.
 */
export function ShareButton({
  text,
  path = "",
  className = "",
}: {
  text: string;
  path?: string;
  className?: string;
}) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");

  const share = async () => {
    const message = `${text} ${window.location.origin}${path}`;
    try {
      if (navigator.share) {
        await navigator.share({ text: message });
        return;
      }
      await navigator.clipboard.writeText(message);
      setState("copied");
    } catch (err) {
      // Closing the share sheet is not an error.
      if (err instanceof DOMException && err.name === "AbortError") return;
      setState("failed");
    }
    window.setTimeout(() => setState("idle"), 2500);
  };

  return (
    <button
      onClick={share}
      className={`rounded-full border border-white/20 px-4 py-1.5 text-sm text-foam hover:bg-white/10 ${className}`}
    >
      {state === "copied" ? "Copied!" : state === "failed" ? "Couldn't share" : "Share"}
    </button>
  );
}
