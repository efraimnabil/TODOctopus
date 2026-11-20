import type { Priority } from "@/game/types";
import { PRIORITIES } from "../priority";

export function PriorityPicker({
  value,
  onChange,
}: {
  value: Priority;
  onChange: (p: Priority) => void;
}) {
  return (
    <div className="flex gap-1" role="radiogroup" aria-label="Priority">
      {PRIORITIES.map((p) => (
        <button
          key={p.value}
          type="button"
          role="radio"
          aria-checked={value === p.value}
          onClick={() => onChange(p.value)}
          className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs transition ${
            value === p.value ? "bg-white/15 text-foam" : "text-foam/50 hover:text-foam"
          }`}
        >
          <span className={`size-2 rounded-full ${p.dot}`} />
          {p.label}
        </button>
      ))}
    </div>
  );
}
