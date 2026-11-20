"use client";

import { useRef, useState, type SubmitEvent } from "react";
import { TITLE_MAX, nextHome } from "@/game/rules";
import type { Priority } from "@/game/types";
import { PriorityPicker } from "./PriorityPicker";
import { useGame } from "./GameProvider";

export function AddTaskForm() {
  const addTask = useGame((s) => s.addTask);
  const home = useGame((s) => nextHome(s.game));
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<Priority>(2);
  const input = useRef<HTMLInputElement>(null);

  const submit = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!title.trim()) return;
    if (addTask({ title, priority })) setTitle("");
    input.current?.focus();
  };

  return (
    <form onSubmit={submit} className="space-y-2">
      <input
        ref={input}
        id="new-task"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="New task → new tentacle"
        maxLength={TITLE_MAX}
        aria-label="New task"
        autoComplete="off"
        className="w-full rounded-full border border-brand-pink/60 bg-transparent px-4 py-2 text-foam placeholder-foam/40 outline-none focus:ring-2 focus:ring-brand-pink/60"
      />
      <div className="flex items-center justify-between gap-2">
        <PriorityPicker value={priority} onChange={setPriority} />
        <button
          type="submit"
          disabled={!title.trim()}
          className="rounded-full bg-brand-gradient px-4 py-1.5 text-sm text-white transition disabled:opacity-40"
        >
          Grow
        </button>
      </div>
      <p className="px-1 text-xs text-foam/45" aria-live="polite">
        {home ? (
          <>
            Grows on <span className="text-foam/70">{home.name}</span>
          </>
        ) : (
          "Summons a new octopus"
        )}
      </p>
    </form>
  );
}
