"use client";

import { useState } from "react";
import { onboardingStep } from "@/game/view";
import { useGame } from "./GameProvider";

const KEY = "todoctopus:hints-dismissed";

function wasDismissed(): boolean {
  try {
    return window.localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

/** A first-run nudge: add a task, then slash it. Gone for good after that. */
export function Onboarding() {
  const step = useGame((s) => onboardingStep(s.game));
  const [dismissed, setDismissed] = useState(wasDismissed);
  if (dismissed || step === "done") return null;

  const hide = () => {
    setDismissed(true);
    try {
      window.localStorage.setItem(KEY, "1");
    } catch {
      // Not remembered; it only shows until the first slash anyway.
    }
  };

  return (
    <div
      role="note"
      className="mb-4 flex items-start gap-2 rounded-2xl bg-brand-gradient p-3 text-sm text-white"
    >
      <p className="flex-1">
        {step === "add" ? (
          <>
            <strong>Add your first task</strong> and watch the octopus grow a tentacle.
          </>
        ) : (
          <>
            <strong>Done with it?</strong> Click or swipe the tentacle to slash it off.
          </>
        )}
      </p>
      <button onClick={hide} aria-label="Hide hint" className="-mt-0.5 px-1 text-lg leading-none">
        ×
      </button>
    </div>
  );
}
