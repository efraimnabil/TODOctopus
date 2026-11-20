import type { GameCommand } from "./rules";
import { emptyGame } from "./rules";
import type { Account, GameState } from "./types";

export interface Loaded {
  game: GameState;
  /** null: no session yet (a guest gets one on their first change) */
  account: Account | null;
}

/**
 * Where the game is kept. The store applies every command locally first (so
 * animations never wait), then hands it here to be saved. A rejected promise
 * makes the store roll back to the saved game.
 */
export interface GameRepository {
  load(): Promise<Loaded>;
  commit(command: GameCommand, next: GameState): Promise<void>;
}

/** Keeps nothing between page loads. Used by tests. */
export class MemoryRepository implements GameRepository {
  constructor(private state: GameState = emptyGame()) {}
  readonly commands: GameCommand[] = [];
  /** Set to make the next commit fail */
  failNext = false;

  async load(): Promise<Loaded> {
    return { game: this.state, account: null };
  }

  async commit(command: GameCommand, next: GameState) {
    if (this.failNext) {
      this.failNext = false;
      throw new Error("save failed");
    }
    this.commands.push(command);
    this.state = next;
  }
}
