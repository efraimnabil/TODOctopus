import type { GameCommand } from "./rules";
import { emptyGame } from "./rules";
import type { GameState } from "./types";

/**
 * Where the game is kept. The store applies every command locally first (so
 * animations never wait), then hands it here to be saved.
 * Phase 3 adds a server-backed repository that replays the command there.
 */
export interface GameRepository {
  load(): Promise<GameState>;
  commit(command: GameCommand, next: GameState): Promise<void>;
}

/** Keeps nothing between page loads. Used by tests. */
export class MemoryRepository implements GameRepository {
  constructor(private state: GameState = emptyGame()) {}
  readonly commands: GameCommand[] = [];

  async load() {
    return this.state;
  }

  async commit(command: GameCommand, next: GameState) {
    this.commands.push(command);
    this.state = next;
  }
}

const STORAGE_KEY = "todoctopus.game.v1";

/** Keeps the game in this browser only, until accounts arrive (Phase 3). */
export class BrowserRepository implements GameRepository {
  async load(): Promise<GameState> {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return emptyGame();
      const parsed = JSON.parse(raw) as Partial<GameState>;
      if (!Array.isArray(parsed.octopuses) || !Array.isArray(parsed.tasks)) return emptyGame();
      return { octopuses: parsed.octopuses, tasks: parsed.tasks };
    } catch {
      return emptyGame();
    }
  }

  async commit(_command: GameCommand, next: GameState) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }
}
