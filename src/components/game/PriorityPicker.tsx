import type { Priority } from "@/game/types";
import { PRIORITIES } from "../priority";

/** Low / Medium / High as one segmented control. */
export function PriorityPicker({
  value,
  onChange,
}: {
  value: Priority;
  onChange: (p: Priority) => void;
}) {
  return (
    <div
      className="flex rounded-full bg-abyss/40 p-0.5 ring-1 ring-white/8"
      role="radiogroup"
      aria-label="Priority"
    >
      {PRIORITIES.map((p) => {
        const on = value === p.value;
        return (
          <button
            key={p.value}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(p.value)}
            className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs transition ${
              on ? "bg-white/15 text-foam shadow-sm" : "text-foam/50 hover:text-foam"
            }`}
          >
            <span className={`size-2 rounded-full ${p.dot} ${on ? "" : "opacity-60"}`} />
            {p.label}
          </button>
        );
      })}
    </div>
  );
}
