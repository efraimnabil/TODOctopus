"use client";

import { useEffect, useRef, useState, type SubmitEvent } from "react";
import { DESCRIPTION_MAX, TITLE_MAX } from "@/game/rules";
import type { Priority, Task } from "@/game/types";
import { PRIORITY_DOT } from "../priority";
import { useGame } from "./GameProvider";
import { PriorityPicker } from "./PriorityPicker";

/** One open task. Click to select (its tentacle glows); expands to edit. */
export function TaskRow({ task, canAct }: { task: Task; canAct: boolean }) {
  const selected = useGame((s) => s.selectedId === task.id);
  const hovered = useGame((s) => s.hoveredId === task.id);
  const select = useGame((s) => s.select);
  const completeTask = useGame((s) => s.completeTask);
  const removeTask = useGame((s) => s.removeTask);
  const [editing, setEditing] = useState(false);
  const row = useRef<HTMLLIElement>(null);

  // Pointing at a tentacle brings its task into view.
  useEffect(() => {
    if (hovered) row.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [hovered]);

  const lit = selected || hovered;

  return (
    <li
      ref={row}
      className={`rounded-2xl transition ${lit ? "bg-white/12 ring-1 ring-brand-pink/70" : "bg-white/6"}`}
    >
      <div className="flex items-center gap-2 px-3 py-2">
        <button
          onClick={() => {
            select(selected ? null : task.id);
            if (selected) setEditing(false);
          }}
          aria-expanded={selected}
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
        >
          <span className={`size-2 shrink-0 rounded-full ${PRIORITY_DOT[task.priority]}`} />
          <span className="truncate">{task.title}</span>
          {task.description && !selected && (
            <span className="shrink-0 text-xs text-foam/40" aria-label="Has notes">
              ¶
            </span>
          )}
        </button>
        {canAct && (
          <button
            onClick={() => completeTask(task.id)}
            className="shrink-0 rounded-full bg-brand-gradient px-2.5 py-0.5 text-xs text-white"
            title="Done: slash this tentacle"
          >
            Slash
          </button>
        )}
      </div>

      {selected &&
        (editing ? (
          <EditTask task={task} onDone={() => setEditing(false)} />
        ) : (
          <div className="px-3 pb-3 text-sm">
            {task.description ? (
              <p className="whitespace-pre-wrap text-foam/75">{task.description}</p>
            ) : (
              <p className="text-foam/40">No notes.</p>
            )}
            {canAct && (
              <div className="mt-2 flex gap-2 text-xs">
                <button
                  onClick={() => setEditing(true)}
                  className="rounded-full bg-white/10 px-3 py-1 text-foam hover:bg-white/15"
                >
                  Edit
                </button>
                <button
                  onClick={() => removeTask(task.id)}
                  className="rounded-full px-3 py-1 text-foam/55 hover:bg-white/10 hover:text-foam"
                  title="Delete: the tentacle retracts (no kill credit)"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        ))}
    </li>
  );
}

function EditTask({ task, onDone }: { task: Task; onDone: () => void }) {
  const editTask = useGame((s) => s.editTask);
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);
  const [priority, setPriority] = useState<Priority>(task.priority);

  const submit = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (editTask(task.id, { title, description, priority })) onDone();
  };

  return (
    <form
      onSubmit={submit}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.stopPropagation();
          onDone();
        }
      }}
      className="space-y-2 px-3 pb-3"
    >
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={TITLE_MAX}
        aria-label="Title"
        autoFocus
        className="w-full rounded-xl border border-white/15 bg-abyss/50 px-3 py-1.5 text-foam outline-none focus:ring-2 focus:ring-brand-pink/60"
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        maxLength={DESCRIPTION_MAX}
        rows={3}
        placeholder="Notes (optional)"
        aria-label="Notes"
        className="w-full resize-none rounded-xl border border-white/15 bg-abyss/50 px-3 py-1.5 text-sm text-foam placeholder-foam/35 outline-none focus:ring-2 focus:ring-brand-pink/60"
      />
      <PriorityPicker value={priority} onChange={setPriority} />
      <div className="flex justify-end gap-2 text-xs">
        <button
          type="button"
          onClick={onDone}
          className="rounded-full px-3 py-1 text-foam/60 hover:bg-white/10"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!title.trim()}
          className="rounded-full bg-brand-gradient px-3 py-1 text-white disabled:opacity-40"
        >
          Save
        </button>
      </div>
    </form>
  );
}
