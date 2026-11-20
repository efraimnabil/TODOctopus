"use client";

import { useMemo, type ReactNode } from "react";
import { MAX_TENTACLES } from "@/game/rules";
import { onStage } from "@/game/store";
import { useGame } from "./GameProvider";
import { AddTaskForm } from "./AddTaskForm";
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
  const tasks = useMemo(
    () =>
      game.tasks
        .filter((t) => t.octopusId === activeId && t.status !== "removed")
        .sort((a, b) => b.priority - a.priority || a.createdAt - b.createdAt),
    [game.tasks, activeId],
  );
  const open = tasks.filter((t) => t.status === "open");
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
                ? `${open.length} to do · ${tasks.length}/${MAX_TENTACLES} arms`
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
        <AddTaskForm />

        {active && (
          <ul className="mt-4 space-y-1.5">
            {open.map((t) => (
              <TaskRow key={t.id} task={t} canAct={alive} />
            ))}
            {open.length === 0 && alive && (
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
                <li key={t.id} className="truncate px-3 py-1 text-foam/40 line-through">
                  {t.title}
                </li>
              ))}
            </ul>
          </details>
        )}
      </div>

      <div className="flex items-center gap-2 overflow-x-auto border-t border-white/10 px-4 py-2 text-xs whitespace-nowrap">
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
