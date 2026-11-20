"use server";

import { currentUser } from "@/lib/auth";
import { commandSchema, withTrustedTime } from "./commands";
import { RuleError } from "./rules";
import { allowWrite, loadGame, runCommand } from "./server";
import type { Account, GameState } from "./types";

/** The caller's saved game, or null if they have no session yet. */
export async function fetchGame(): Promise<{ game: GameState; account: Account } | null> {
  const user = await currentUser();
  if (!user) return null;
  return {
    game: await loadGame(user.id),
    account: {
      name: user.name,
      email: user.isAnonymous ? null : user.email,
      isGuest: Boolean(user.isAnonymous),
    },
  };
}

export type CommitResult =
  | { ok: true }
  | { ok: false; reason: "signed-out" | "invalid" | "refused" | "rate-limited" | "error" };

/** Saves one game command for the caller (guest or account). */
export async function commitCommand(input: unknown): Promise<CommitResult> {
  const user = await currentUser();
  if (!user) return { ok: false, reason: "signed-out" };

  const parsed = commandSchema.safeParse(input);
  if (!parsed.success) return { ok: false, reason: "invalid" };

  if (!(await allowWrite(user.id))) return { ok: false, reason: "rate-limited" };

  try {
    await runCommand(user.id, withTrustedTime(parsed.data, Date.now()));
    return { ok: true };
  } catch (err) {
    if (err instanceof RuleError) return { ok: false, reason: "refused" };
    console.error("commitCommand failed", err);
    return { ok: false, reason: "error" };
  }
}
