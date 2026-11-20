import { authClient } from "@/lib/auth-client";
import { commitCommand, fetchGame, type CommitResult } from "./actions";
import type { GameRepository, Loaded } from "./repository";
import { emptyGame, type GameCommand } from "./rules";

export class SaveError extends Error {
  constructor(readonly reason: Exclude<CommitResult, { ok: true }>["reason"] | "no-session") {
    super(reason);
    this.name = "SaveError";
  }
}

/**
 * Saves to the server. Someone without a session gets a silent guest
 * (anonymous) account on their first change. Commits go out one at a time,
 * in order, so the server replays them exactly as the browser did.
 */
export class ServerRepository implements GameRepository {
  private queue: Promise<unknown> = Promise.resolve();
  private hasSession = false;

  async load(): Promise<Loaded> {
    const saved = await fetchGame();
    this.hasSession = saved !== null;
    return saved ?? { game: emptyGame(), account: null };
  }

  commit(command: GameCommand): Promise<void> {
    const job = this.queue.then(async () => {
      if (!this.hasSession) {
        const { error } = await authClient.signIn.anonymous();
        if (error) throw new SaveError("no-session");
        this.hasSession = true;
      }
      const result = await commitCommand(command);
      if (!result.ok) {
        if (result.reason === "signed-out") this.hasSession = false;
        throw new SaveError(result.reason);
      }
    });
    this.queue = job.catch(() => {});
    return job;
  }
}
