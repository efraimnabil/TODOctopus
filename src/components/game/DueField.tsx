import { endOfDay, toDateInput } from "@/game/due";

/** An optional deadline: a date input that reads and writes epoch ms. */
export function DueField({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (dueAt: number | null) => void;
}) {
  return (
    <label className="flex items-center gap-2 px-1 text-xs text-foam/60">
      Due
      <input
        type="date"
        value={toDateInput(value)}
        onChange={(e) => onChange(endOfDay(e.target.value))}
        aria-label="Due date"
        className="rounded-full border border-white/15 bg-abyss/50 px-2.5 py-0.5 text-foam [color-scheme:dark] outline-none focus:ring-2 focus:ring-brand-pink/60"
      />
      {value !== null && (
        <button
          type="button"
          onClick={() => onChange(null)}
          className="rounded-full px-2 py-0.5 hover:bg-white/10"
        >
          Clear
        </button>
      )}
    </label>
  );
}
