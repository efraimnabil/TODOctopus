import { createStore } from "zustand/vanilla";
import type { GameRepository } from "./repository";
import {
  RuleError,
  apply,
  emptyGame,
  livingOctopuses,
  pickName,
  type GameCommand,
  type GameEvent,
} from "./rules";
import { isOverdue } from "./due";
import type { Octopus as SceneOctopus, Tentacle as SceneTentacle } from "./scene";
import type { Account, GameState, Octopus, TaskInput } from "./types";

export interface GameDeps {
  now: () => number;
  random: () => number;
  id: () => string;
  /** Told what just happened (the app plays sounds from this) */
  onEvents?: (events: GameEvent[]) => void;
}

export const browserDeps: GameDeps = {
  now: () => Date.now(),
  random: () => Math.random(),
  id: () => crypto.randomUUID(),
};

export interface GameStoreState {
  status: "loading" | "ready";
  game: GameState;
  /** The octopus on stage */
  activeId: string | null;
  /** Task picked in the list (its tentacle glows) */
  selectedId: string | null;
  /** Task whose tentacle the pointer is on */
  hoveredId: string | null;
  /** Deleted this session, tentacle still shrinking away */
  retracting: string[];
  /** Defeated this session, death animation still playing */
  dying: string[];
  /** Death animation done: show the "defeated" card for this octopus */
  defeatedCard: string | null;
  error: string | null;
  /** What just happened, in words, for screen readers (an aria-live region) */
  announcement: string;
  /** Who owns this game; null until the first change creates a guest */
  account: Account | null;
  /** Changes not yet confirmed as saved */
  pending: number;

  load(): Promise<void>;
  /** Re-read the saved game (after signing in/out, or a failed save) */
  reload(): Promise<void>;
  addTask(input: TaskInput): boolean;
  editTask(taskId: string, patch: Partial<TaskInput>): boolean;
  completeTask(taskId: string, cutIndex?: number): void;
  removeTask(taskId: string): void;
  /** The 3D tentacle finished retracting */
  retracted(taskId: string): void;
  /** The 3D death animation finished */
  deathFinished(octopusId: string): void;
  dismissDefeat(): void;
  setActive(octopusId: string): void;
  /** Move to the previous (-1) or next (+1) octopus */
  step(direction: 1 | -1): void;
  select(taskId: string | null): void;
  hover(taskId: string | null): void;
  clearError(): void;
}

export type GameStore = ReturnType<typeof createGameStore>;

export function createGameStore(repo: GameRepository, deps: GameDeps = browserDeps) {
  return createStore<GameStoreState>()((set, get) => {
    /** Applies a command now, then saves it in the background. */
    function run(command: GameCommand): boolean {
      let result;
      try {
        result = apply(get().game, command);
      } catch (err) {
        set({ error: err instanceof RuleError ? err.message : "Something went wrong" });
        return false;
      }
      set((s) => ({
        game: result.state,
        error: null,
        pending: s.pending + 1,
        ...react(s, result.events),
        announcement: describe(result.events) ?? s.announcement,
      }));
      deps.onEvents?.(result.events);
      repo.commit(command, result.state).then(
        () =>
          set((s) => ({
            pending: s.pending - 1,
            // The first save gives a newcomer a guest account.
            account: s.account ?? { name: "Guest", email: null, isGuest: true },
          })),
        (err: unknown) => {
          set((s) => ({ pending: s.pending - 1, error: saveErrorMessage(err) }));
          // Undo what the server didn't accept.
          void get().reload();
        },
      );
      return true;
    }

    /** UI side effects of what just happened in the game. */
    function react(s: GameStoreState, events: GameEvent[]): Partial<GameStoreState> {
      const out: Partial<GameStoreState> = {};
      let { activeId, retracting, dying, selectedId } = s;
      for (const e of events) {
        if (e.type === "spawned") activeId = e.octopus.id;
        if (e.type === "grew") activeId = e.task.octopusId;
        if (e.type === "removed") retracting = [...retracting, e.task.id];
        if (e.type === "defeated") dying = [...dying, e.octopus.id];
        if ((e.type === "cut" || e.type === "removed") && selectedId === e.task.id) selectedId = null;
      }
      if (activeId !== s.activeId) {
        // Moving away from a dying octopus skips the rest of its farewell.
        dying = dying.filter((id) => id !== s.activeId);
        out.defeatedCard = null;
      }
      return { ...out, activeId, retracting, dying, selectedId };
    }

    return {
      status: "loading",
      game: emptyGame(),
      activeId: null,
      selectedId: null,
      hoveredId: null,
      retracting: [],
      dying: [],
      defeatedCard: null,
      error: null,
      announcement: "",
      account: null,
      pending: 0,

      async load() {
        const { game, account } = await repo.load();
        set({ game, account, status: "ready", activeId: livingOctopuses(game)[0]?.id ?? null });
      },

      async reload() {
        let loaded;
        try {
          loaded = await repo.load();
        } catch {
          set({ error: "Couldn't reach the server" });
          return;
        }
        const { game, account } = loaded;
        set((s) => {
          const alive = livingOctopuses(game);
          const keep = alive.some((o) => o.id === s.activeId);
          return {
            game,
            account,
            activeId: keep ? s.activeId : (alive[0]?.id ?? null),
            selectedId: game.tasks.some((t) => t.id === s.selectedId && t.status === "open")
              ? s.selectedId
              : null,
            retracting: [],
            dying: [],
            defeatedCard: null,
          };
        });
      },

      addTask(input) {
        const { game } = get();
        return run({
          type: "addTask",
          taskId: deps.id(),
          input,
          at: deps.now(),
          spawn: {
            id: deps.id(),
            name: pickName(game, deps.random()),
            seed: Math.floor(deps.random() * 10_000),
          },
        });
      },

      editTask(taskId, patch) {
        return run({ type: "editTask", taskId, patch });
      },

      completeTask(taskId, cutIndex) {
        run({ type: "completeTask", taskId, at: deps.now(), cutIndex: cutIndex ?? null });
      },

      removeTask(taskId) {
        run({ type: "removeTask", taskId, at: deps.now() });
      },

      retracted(taskId) {
        set((s) => ({ retracting: s.retracting.filter((id) => id !== taskId) }));
      },

      deathFinished(octopusId) {
        set((s) =>
          s.dying.includes(octopusId)
            ? { dying: s.dying.filter((id) => id !== octopusId), defeatedCard: octopusId }
            : {},
        );
      },

      dismissDefeat() {
        set((s) => ({
          defeatedCard: null,
          activeId: livingOctopuses(s.game)[0]?.id ?? null,
        }));
      },

      setActive(octopusId) {
        set((s) =>
          s.activeId === octopusId
            ? {}
            : {
                activeId: octopusId,
                dying: s.dying.filter((id) => id !== s.activeId),
                defeatedCard: null,
                hoveredId: null,
              },
        );
      },

      step(direction) {
        const s = get();
        const list = onStage(s);
        if (list.length < 2) return;
        const i = Math.max(0, list.findIndex((o) => o.id === s.activeId));
        get().setActive(list[(i + direction + list.length) % list.length].id);
      },

      select(taskId) {
        const s = get();
        const task = taskId ? s.game.tasks.find((t) => t.id === taskId) : null;
        if (task && task.octopusId !== s.activeId) get().setActive(task.octopusId);
        set({ selectedId: task?.id ?? null });
      },

      hover(taskId) {
        if (get().hoveredId !== taskId) set({ hoveredId: taskId });
      },

      clearError() {
        set({ error: null });
      },
    };
  });
}

/** A sentence for screen readers about what a command just did. */
export function describe(events: GameEvent[]): string | null {
  const parts: string[] = [];
  for (const e of events) {
    if (e.type === "spawned") parts.push(`A new octopus, ${e.octopus.name}, appeared.`);
    else if (e.type === "grew") parts.push(`Added “${e.task.title}”.`);
    else if (e.type === "cut") parts.push(`Slashed “${e.task.title}”.`);
    else if (e.type === "removed") parts.push(`Deleted “${e.task.title}”.`);
    else if (e.type === "defeated") parts.push(`${e.octopus.name} is defeated.`);
  }
  return parts.length ? parts.join(" ") : null;
}

function saveErrorMessage(err: unknown): string {
  const reason = err instanceof Error ? err.message : "";
  if (reason === "rate-limited") return "Whoa, that's a lot of changes. Slow down a moment.";
  if (reason === "no-session") return "Couldn't start your session. Check your connection.";
  return "Couldn't save that change, so it was undone.";
}

// ── Selectors ──────────────────────────────────────────────────────────────

/** Octopuses you can switch between: the living, plus one still saying goodbye. */
export function onStage(s: Pick<GameStoreState, "game" | "dying" | "defeatedCard">): Octopus[] {
  return s.game.octopuses.filter(
    (o) => o.status === "alive" || s.dying.includes(o.id) || s.defeatedCard === o.id,
  );
}

/** The game state of one octopus, as the 3D scene should draw it right now. */
export function toScene(
  s: Pick<GameStoreState, "game" | "dying" | "retracting">,
  octopusId: string,
  now: number = Date.now(),
): SceneOctopus | null {
  const octopus = s.game.octopuses.find((o) => o.id === octopusId);
  if (!octopus) return null;
  const tentacles: SceneTentacle[] = [];
  for (const t of s.game.tasks) {
    if (t.octopusId !== octopusId) continue;
    const status =
      t.status === "open"
        ? "alive"
        : t.status === "done"
          ? "cut"
          : s.retracting.includes(t.id)
            ? "retracting"
            : null;
    if (!status) continue;
    tentacles.push({
      id: t.id,
      slot: t.slot,
      title: t.title,
      priority: t.priority,
      status,
      cutIndex: t.cutIndex ?? undefined,
      overdue: isOverdue(t, now),
    });
  }
  return {
    id: octopus.id,
    name: octopus.name,
    seed: octopus.seed,
    status:
      octopus.status === "alive" ? "alive" : s.dying.includes(octopus.id) ? "dying" : "dead",
    tentacles,
  };
}
