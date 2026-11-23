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
import { useGame, useGameStore } from "./GameProvider";
import { AddTaskForm } from "./AddTaskForm";
import { Onboarding } from "./Onboarding";
import { CheckIcon, ChevronIcon, SparkIcon } from "./icons";
import { TaskRow } from "./TaskRow";
import { whatFirst } from "./whatFirst";

/** The list side of the game: switch octopus, add, finish, edit, delete. */
export function TaskPanel() {
  const game = useGame((s) => s.game);
  const activeId = useGame((s) => s.activeId);
  const dying = useGame((s) => s.dying);
  const defeatedCard = useGame((s) => s.defeatedCard);
  const step = useGame((s) => s.step);
  const setActive = useGame((s) => s.setActive);
  const store = useGameStore();

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
  const progress = tasks.length ? done.length / tasks.length : 0;

  return (
    <aside
      aria-label="Tasks"
      className="glass absolute right-3 bottom-3 left-3 flex max-h-[55dvh] flex-col rounded-3xl shadow-2xl md:top-28 md:right-auto md:bottom-auto md:left-6 md:max-h-[calc(100dvh-9rem)] md:w-96"
    >
      {active && (
        <div className="border-b border-white/10 px-2 pt-2 pb-3">
          <div className="flex items-center gap-1">
            <SwitchButton label="Previous octopus" onClick={() => step(-1)} hidden={stage.length < 2}>
              <ChevronIcon size={18} className="rotate-180" />
            </SwitchButton>
            <div className="min-w-0 flex-1 text-center">
              <h2 className="truncate text-xl leading-tight">{active.name}</h2>
              <p className="text-xs text-foam/55">
                {alive
                  ? `${done.length} of ${tasks.length} slashed · ${tasks.length}/${MAX_TENTACLES} arms`
                  : "Defeated"}
              </p>
            </div>
            <SwitchButton label="Next octopus" onClick={() => step(1)} hidden={stage.length < 2}>
              <ChevronIcon size={18} />
            </SwitchButton>
          </div>
          <div className="mx-3 mt-2 h-1 overflow-hidden rounded-full bg-white/10" aria-hidden>
            <div
              className="h-full rounded-full bg-brand-gradient transition-[width] duration-500"
              style={{ width: `${alive ? progress * 100 : 100}%` }}
            />
          </div>
          {stage.length > 1 && (
            <div className="mt-2.5 flex items-center justify-center gap-1.5" role="tablist" aria-label="Octopuses">
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
              <span className="ml-1 text-[0.65rem] text-foam/45">
                {index + 1}/{stage.length}
              </span>
            </div>
          )}
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto p-3 md:p-4">
        <Onboarding />
        <AddTaskForm />

        {active && allOpen.length > 0 && (
          <div className="mt-5 flex items-center justify-between gap-2 px-1">
            <h3 className="text-[0.7rem] tracking-[0.18em] text-foam/50 uppercase">
              To do <span className="text-foam/80">{allOpen.length}</span>
            </h3>
            {alive && allOpen.length > 1 && (
              <button
                onClick={() => whatFirst(store)}
                title="Pick the most urgent task (W)"
                className="flex items-center gap-1.5 rounded-full bg-white/8 px-2.5 py-1 text-xs text-foam/85 ring-1 ring-brand-pink/35 transition hover:bg-brand-pink/15 hover:text-foam"
              >
                <SparkIcon size={12} />
                What first?
              </button>
            )}
          </div>
        )}

        {active && allOpen.length > 1 && (
          <div className="mt-2 flex items-center gap-2 px-1 text-xs">
            <div
              role="group"
              aria-label="Show priority"
              className="flex rounded-full bg-abyss/40 p-0.5 ring-1 ring-white/8"
            >
              {(["all", 3, 2, 1] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setFilter(p)}
                  aria-pressed={filter === p}
                  className={`rounded-full px-2.5 py-0.5 transition ${
                    filter === p ? "bg-white/15 text-foam" : "text-foam/50 hover:text-foam"
                  }`}
                >
                  {p === "all" ? "All" : p === 3 ? "High" : p === 2 ? "Medium" : "Low"}
                </button>
              ))}
            </div>
            <label className="ml-auto flex items-center gap-1.5 text-foam/50">
              <span className="sr-only md:not-sr-only">Sort</span>
              <select
                aria-label="Sort"
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                className="rounded-full bg-abyss/40 px-2 py-0.5 text-foam ring-1 ring-white/8 outline-none focus-visible:ring-2 focus-visible:ring-brand-pink/60"
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
          <ul className="mt-2.5 space-y-1.5">
            {open.map((t) => (
              <TaskRow key={t.id} task={t} canAct={alive} />
            ))}
            {open.length === 0 && alive && allOpen.length > 0 && (
              <li className="px-1 py-2 text-sm text-foam/50">No tasks with this priority here.</li>
            )}
          </ul>
        )}
        {active && alive && allOpen.length === 0 && (
          <p className="mt-5 rounded-2xl border border-dashed border-white/12 px-4 py-4 text-center text-sm text-foam/50">
            No tentacles left to slash. Add a task to grow one.
          </p>
        )}
        {!active && (
          <p className="mt-5 rounded-2xl border border-dashed border-white/12 px-4 py-4 text-sm text-foam/55">
            Every task grows a tentacle. Finish it and slash it off. Slash all of an
            octopus&rsquo;s tentacles to defeat it.
          </p>
        )}

        {done.length > 0 && (
          <details className="group/done mt-4 text-sm" open={done.length <= 3}>
            <summary className="flex cursor-pointer list-none items-center gap-1.5 px-1 text-xs tracking-[0.18em] text-foam/50 uppercase select-none hover:text-foam/80 [&::-webkit-details-marker]:hidden">
              <ChevronIcon size={12} className="transition-transform group-open/done:rotate-90" />
              Slashed ({done.length})
            </summary>
            <ul className="mt-1.5 space-y-0.5">
              {done.map((t) => (
                <li
                  key={t.id}
                  dir="auto"
                  className="flex items-center gap-2 truncate px-3 py-1 text-foam/45 line-through"
                >
                  <CheckIcon size={12} className="shrink-0 text-brand-pink/70" />
                  <span className="truncate">{t.title}</span>
                </li>
              ))}
            </ul>
          </details>
        )}
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
      className={`grid size-9 shrink-0 place-items-center rounded-full text-foam/70 hover:bg-white/10 hover:text-foam ${
        hidden ? "invisible" : ""
      }`}
    >
      {children}
    </button>
  );
}
