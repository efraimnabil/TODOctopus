"use client";

import { useMemo, useState, type ReactNode } from "react";
import { MAX_TENTACLES } from "@/game/rules";
import { onStage } from "@/game/store";
import {
  SORT_LABELS,
  filterTasks,
  sortTasks,
  type PriorityFilter,
  type SortKey,
} from "@/game/view";
import { useGame } from "./GameProvider";
import { AddTaskForm } from "./AddTaskForm";
import { Onboarding } from "./Onboarding";
import { TaskRow } from "./TaskRow";

/** The list side of the game: switch octopus, add, finish, edit, delete. */
export function TaskPanel({ footer }: { footer: ReactNode }) {
  const game = useGame((s) => s.game);
  const activeId = useGame((s) => s.activeId);
  const dying = useGame((s) => s.dying);
  const defeatedCard = useGame((s) => s.defeatedCard);
  const step = useGame((s) => s.step);
  const setActive = useGame((s) => s.setActive);

  const stage = useMemo(
    () => onStage({ game, dying, defeatedCard }),
    [game, dying, defeatedCard],
  );
  const active = stage.find((o) => o.id === activeId) ?? null;
  const index = active ? stage.indexOf(active) : -1;
  const [sort, setSort] = useState<SortKey>("priority");
  const [filter, setFilter] = useState<PriorityFilter>("all");
  const tasks = useMemo(
    () =>
      sortTasks(
        game.tasks.filter((t) => t.octopusId === activeId && t.status !== "removed"),
        "priority",
      ),
    [game.tasks, activeId],
  );
  const allOpen = useMemo(() => tasks.filter((t) => t.status === "open"), [tasks]);
  const open = useMemo(
    () => sortTasks(filterTasks(allOpen, filter), sort),
    [allOpen, filter, sort],
  );
  const done = tasks.filter((t) => t.status === "done");
  const alive = active?.status === "alive";

  return (
    <aside
      aria-label="Tasks"
      className="glass absolute right-3 bottom-3 left-3 flex max-h-[50dvh] flex-col rounded-3xl md:top-28 md:right-auto md:bottom-auto md:left-6 md:max-h-[calc(100dvh-9rem)] md:w-84"
    >
      {active && (
        <div className="flex items-center gap-1 border-b border-white/10 px-2 py-2">
          <SwitchButton label="Previous octopus" onClick={() => step(-1)} hidden={stage.length < 2}>
            ‹
          </SwitchButton>
          <div className="min-w-0 flex-1 text-center">
            <h2 className="truncate text-xl leading-tight">{active.name}</h2>
            <p className="text-xs text-foam/55">
              {alive
                ? `${allOpen.length} to do · ${tasks.length}/${MAX_TENTACLES} arms`
                : "Defeated"}
              {stage.length > 1 && ` · ${index + 1} of ${stage.length}`}
            </p>
          </div>
          <SwitchButton label="Next octopus" onClick={() => step(1)} hidden={stage.length < 2}>
            ›
          </SwitchButton>
        </div>
      )}
      {stage.length > 1 && (
        <div className="flex justify-center gap-1.5 pt-2" role="tablist" aria-label="Octopuses">
          {stage.map((o) => (
            <button
              key={o.id}
              role="tab"
              aria-selected={o.id === activeId}
              aria-label={o.name}
              title={o.name}
              onClick={() => setActive(o.id)}
              className={`h-1.5 rounded-full transition-all ${
                o.id === activeId ? "w-5 bg-brand-gradient" : "w-1.5 bg-white/25 hover:bg-white/50"
              }`}
            />
          ))}
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        <Onboarding />
        <AddTaskForm />

        {active && allOpen.length > 1 && (
          <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs">
            <div role="group" aria-label="Show priority" className="flex gap-1">
              {(["all", 3, 2, 1] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setFilter(p)}
                  aria-pressed={filter === p}
                  className={`rounded-full px-2.5 py-0.5 ${
                    filter === p ? "bg-white/20 text-foam" : "text-foam/55 hover:bg-white/10"
                  }`}
                >
                  {p === "all" ? "All" : p === 3 ? "High" : p === 2 ? "Medium" : "Low"}
                </button>
              ))}
            </div>
            <label className="ml-auto flex items-center gap-1.5 text-foam/55">
              Sort
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                className="rounded-full border border-white/15 bg-abyss/60 px-2 py-0.5 text-foam outline-none"
              >
                {(Object.keys(SORT_LABELS) as SortKey[]).map((k) => (
                  <option key={k} value={k}>
                    {SORT_LABELS[k]}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}

        {active && (
          <ul className="mt-3 space-y-1.5">
            {open.map((t) => (
              <TaskRow key={t.id} task={t} canAct={alive} />
            ))}
            {open.length === 0 && alive && allOpen.length > 0 && (
              <li className="px-1 py-2 text-sm text-foam/50">No tasks with this priority here.</li>
            )}
            {allOpen.length === 0 && alive && (
              <li className="px-1 py-2 text-sm text-foam/50">
                No tentacles to slash. Add a task to grow one.
              </li>
            )}
          </ul>
        )}
        {!active && (
          <p className="mt-4 px-1 text-sm text-foam/55">
            Every task grows a tentacle. Finish it and slash it off. Slash all of an
            octopus&rsquo;s tentacles to defeat it.
          </p>
        )}

        {done.length > 0 && (
          <details className="mt-4 text-sm" open={done.length <= 3}>
            <summary className="cursor-pointer px-1 text-foam/50 select-none">
              Slashed ({done.length})
            </summary>
            <ul className="mt-1.5 space-y-1">
              {done.map((t) => (
                <li key={t.id} className="truncate px-3 py-1 text-foam/60 line-through">
                  {t.title}
                </li>
              ))}
            </ul>
          </details>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-white/10 px-4 py-2 text-xs whitespace-nowrap">
        {footer}
      </div>
    </aside>
  );
}

function SwitchButton({
  label,
  onClick,
  hidden,
  children,
}: {
  label: string;
  onClick: () => void;
  hidden: boolean;
  children: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`grid size-9 shrink-0 place-items-center rounded-full text-2xl leading-none text-foam/70 hover:bg-white/10 hover:text-foam ${
        hidden ? "invisible" : ""
      }`}
    >
      {children}
    </button>
  );
}
