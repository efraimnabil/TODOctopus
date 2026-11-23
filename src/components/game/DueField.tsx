"use client";

import { useRef } from "react";
import { dueLabel, endOfDay, toDateInput } from "@/game/due";
import { useNow } from "@/lib/useNow";
import { CalendarIcon, CloseIcon } from "./icons";

/**
 * An optional deadline as a compact chip: "Due date" when empty, "Due
 * tomorrow" once set. The native date input sits invisibly on top, so the
 * browser's own picker (and keyboard entry) still work.
 */
export function DueField({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (dueAt: number | null) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const now = useNow();
  const label = value !== null ? dueLabel(value, now) : null;

  return (
    <div
      className={`relative flex items-center rounded-full text-xs transition has-[input:focus-visible]:ring-2 has-[input:focus-visible]:ring-brand-pink/60 ${
        label?.tone === "overdue"
          ? "bg-red-500/20 text-red-100"
          : label
            ? "bg-white/12 text-foam"
            : "text-foam/55 hover:bg-white/8 hover:text-foam"
      }`}
    >
      <span className="pointer-events-none flex items-center gap-1.5 py-1 pr-2.5 pl-2">
        <CalendarIcon size={13} />
        {label ? label.text : "Due date"}
      </span>
      <input
        ref={input}
        type="date"
        value={toDateInput(value)}
        onChange={(e) => onChange(endOfDay(e.target.value))}
        onClick={() => {
          try {
            input.current?.showPicker();
          } catch {
            // Older browsers: the input still takes typed dates.
          }
        }}
        aria-label="Due date"
        className="absolute inset-0 w-full cursor-pointer opacity-0 [color-scheme:dark] focus-visible:outline-none"
      />
      {value !== null && (
        <button
          type="button"
          onClick={() => onChange(null)}
          aria-label="Remove deadline"
          title="Remove deadline"
          className="relative -ml-1.5 mr-1 grid size-5 place-items-center rounded-full text-foam/60 hover:bg-white/15 hover:text-foam"
        >
          <CloseIcon size={11} />
        </button>
      )}
    </div>
  );
}
