"use client";

import { useEffect, useRef, useState, type SubmitEvent } from "react";
import { DESCRIPTION_MAX, TITLE_MAX } from "@/game/rules";
import type { Priority, Task } from "@/game/types";
import { dueLabel } from "@/game/due";
import { useNow } from "@/lib/useNow";
import { PRIORITY_DOT } from "../priority";
import { DueField } from "./DueField";
import { useGame } from "./GameProvider";
import { CheckIcon, NoteIcon, PencilIcon, TrashIcon } from "./icons";
import { PriorityPicker } from "./PriorityPicker";

const PRIORITY_EDGE: Record<Priority, string> = {
  1: "before:bg-emerald-400",
  2: "before:bg-amber-400",
  3: "before:bg-rose-500",
};

const iconButton =
  "grid size-7 shrink-0 place-items-center rounded-full text-foam/55 transition hover:bg-white/12 hover:text-foam";

/**
 * One open task. The round button slashes it; clicking the title picks it
 * (its tentacle glows) and shows its notes; the pencil edits in place.
 */
export function TaskRow({ task, canAct }: { task: Task; canAct: boolean }) {
  const selected = useGame((s) => s.selectedId === task.id);
  const hovered = useGame((s) => s.hoveredId === task.id);
  const select = useGame((s) => s.select);
  const completeTask = useGame((s) => s.completeTask);
  const [editing, setEditing] = useState(false);
  const row = useRef<HTMLLIElement>(null);
  const now = useNow();
  const due = task.dueAt !== null ? dueLabel(task.dueAt, now) : null;

  // Pointing at a tentacle brings its task into view.
  useEffect(() => {
    if (hovered) row.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [hovered]);

  const lit = selected || hovered;

  if (editing) {
    return (
      <li ref={row} className="rounded-2xl bg-white/10 ring-1 ring-brand-pink/60">
        <EditTask task={task} onDone={() => setEditing(false)} />
      </li>
    );
  }

  return (
    <li
      ref={row}
      className={`group relative overflow-hidden rounded-2xl transition before:absolute before:inset-y-2 before:left-0 before:w-0.75 before:rounded-full ${
        PRIORITY_EDGE[task.priority]
      } ${lit ? "bg-white/12 ring-1 ring-brand-pink/70" : "bg-white/6 hover:bg-white/9"}`}
    >
      <div className="flex items-center gap-2 py-1.5 pr-1.5 pl-2.5">
        {canAct ? (
          <button
            onClick={() => completeTask(task.id)}
            aria-label="Slash"
            title="Done: slash this tentacle"
            className="grid size-6 shrink-0 place-items-center rounded-full border-2 border-foam/35 text-transparent transition hover:border-transparent hover:bg-brand-gradient hover:text-white active:scale-90"
          >
            <CheckIcon size={13} strokeWidth={3} />
          </button>
        ) : (
          <span className={`ml-1 size-2 shrink-0 rounded-full ${PRIORITY_DOT[task.priority]}`} />
        )}

        <button
          onClick={() => select(selected ? null : task.id)}
          aria-expanded={selected}
          className="flex min-w-0 flex-1 flex-col items-start py-0.5 text-left"
        >
          <span dir="auto" className={`w-full ${selected ? "break-words" : "truncate"}`}>
            {task.title}
          </span>
          {(due || task.description) && (
            <span className="mt-0.5 flex items-center gap-1.5 text-[0.68rem]">
              {due && (
                <span
                  className={`rounded-full px-1.5 py-px ${
                    due.tone === "overdue"
                      ? "bg-red-500/25 text-red-200"
                      : due.tone === "soon"
                        ? "bg-amber-400/20 text-amber-100"
                        : "bg-white/10 text-foam/70"
                  }`}
                >
                  {due.text}
                </span>
              )}
              {task.description && !selected && (
                <span className="flex items-center gap-0.5 text-foam/50" aria-label="Has notes">
                  <NoteIcon size={11} /> notes
                </span>
              )}
            </span>
          )}
        </button>

        {canAct && (
          <div
            className={`flex items-center transition-opacity ${
              selected
                ? ""
                : "md:opacity-0 md:group-focus-within:opacity-100 md:group-hover:opacity-100"
            }`}
          >
            <button
              onClick={() => {
                select(task.id);
                setEditing(true);
              }}
              aria-label="Edit"
              title="Edit"
              className={iconButton}
            >
              <PencilIcon size={14} />
            </button>
            <DeleteButton taskId={task.id} />
          </div>
        )}
      </div>

      {selected && (
        <div className="px-3 pb-3 pl-10.5 text-sm">
          {task.description ? (
            <p dir="auto" className="whitespace-pre-wrap text-foam/75">
              {task.description}
            </p>
          ) : canAct ? (
            <button onClick={() => setEditing(true)} className="text-foam/45 hover:text-foam/80">
              + Add notes
            </button>
          ) : (
            <p className="text-foam/45">No notes.</p>
          )}
        </div>
      )}
    </li>
  );
}

/** Asks once before deleting: the first click arms it, the second deletes. */
function DeleteButton({ taskId }: { taskId: string }) {
  const removeTask = useGame((s) => s.removeTask);
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    if (!armed) return;
    const t = window.setTimeout(() => setArmed(false), 3000);
    return () => window.clearTimeout(t);
  }, [armed]);

  if (armed) {
    return (
      <button
        onClick={() => removeTask(taskId)}
        onBlur={() => setArmed(false)}
        autoFocus
        className="ml-0.5 rounded-full bg-rose-500/85 px-2.5 py-1 text-xs text-white hover:bg-rose-500"
        title="The tentacle retracts (no kill credit)"
      >
        Delete
      </button>
    );
  }
  return (
    <button
      onClick={() => setArmed(true)}
      aria-label="Delete task"
      title="Delete: the tentacle retracts (no kill credit)"
      className={`${iconButton} hover:text-rose-300`}
    >
      <TrashIcon size={14} />
    </button>
  );
}

function EditTask({ task, onDone }: { task: Task; onDone: () => void }) {
  const editTask = useGame((s) => s.editTask);
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);
  const [priority, setPriority] = useState<Priority>(task.priority);
  const [dueAt, setDueAt] = useState<number | null>(task.dueAt);

  const submit = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (editTask(task.id, { title, description, priority, dueAt })) onDone();
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
      className="space-y-2 p-2.5"
    >
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={TITLE_MAX}
        aria-label="Title"
        dir="auto"
        autoFocus
        className="w-full rounded-xl bg-abyss/50 px-3 py-2 text-foam ring-1 ring-white/15 outline-none focus:ring-2 focus:ring-brand-pink/60 focus-visible:outline-none"
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        maxLength={DESCRIPTION_MAX}
        rows={3}
        dir="auto"
        placeholder="Notes (optional)"
        aria-label="Notes"
        className="w-full resize-none rounded-xl bg-abyss/50 px-3 py-2 text-sm text-foam placeholder-foam/35 ring-1 ring-white/15 outline-none focus:ring-2 focus:ring-brand-pink/60 focus-visible:outline-none"
      />
      <div className="flex flex-wrap items-center gap-1.5">
        <PriorityPicker value={priority} onChange={setPriority} />
        <DueField value={dueAt} onChange={setDueAt} />
      </div>
      <div className="flex justify-end gap-2 pt-1 text-xs">
        <button
          type="button"
          onClick={onDone}
          className="rounded-full px-3 py-1.5 text-foam/60 hover:bg-white/10 hover:text-foam"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!title.trim()}
          className="rounded-full bg-brand-gradient px-4 py-1.5 text-white disabled:opacity-40"
        >
          Save
        </button>
      </div>
    </form>
  );
}
