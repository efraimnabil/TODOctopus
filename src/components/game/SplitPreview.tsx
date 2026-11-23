"use client";

import { useState } from "react";
import type { Subtask } from "@/ai/subtasks";
import { PRIORITIES } from "../priority";

/** AI-suggested steps: untick what you don't want, then grow the rest. */
export function SplitPreview({
  steps,
  onGrow,
  onCancel,
}: {
  steps: Subtask[];
  onGrow: (picked: Subtask[]) => void;
  onCancel: () => void;
}) {
  const [off, setOff] = useState<ReadonlySet<number>>(new Set());
  const picked = steps.filter((_, i) => !off.has(i));

  const toggle = (i: number) =>
    setOff((prev) => {
      const next = new Set(prev);
      if (!next.delete(i)) next.add(i);
      return next;
    });

  return (
    <div className="glass space-y-2 rounded-2xl p-3" role="group" aria-label="Suggested steps">
      <p className="text-xs text-foam/60">✨ Suggested steps. Untick what you don&rsquo;t want.</p>
      <ul className="space-y-1">
        {steps.map((s, i) => {
          const dot = PRIORITIES.find((p) => p.value === s.priority)?.dot ?? "";
          return (
            <li key={i}>
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={!off.has(i)}
                  onChange={() => toggle(i)}
                  className="size-4 accent-brand-pink"
                />
                <span className={`size-2 rounded-full ${dot}`} aria-hidden />
                <span dir="auto" className={off.has(i) ? "text-foam/40 line-through" : "text-foam"}>
                  {s.title}
                </span>
              </label>
            </li>
          );
        })}
      </ul>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={picked.length === 0}
          onClick={() => onGrow(picked)}
          className="rounded-full bg-brand-gradient px-4 py-1.5 text-sm text-white transition disabled:opacity-40"
        >
          Grow {picked.length}
        </button>
        <button type="button" onClick={onCancel} className="rounded-full px-3 py-1 text-sm text-foam/60">
          Cancel
        </button>
      </div>
    </div>
  );
}
