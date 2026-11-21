import "server-only";
import { currentUser } from "@/lib/auth";
import { allow } from "@/lib/limit";
import { AI_DAILY_LIMIT, aiEnabled } from "./config";
import { AiInputError, type AiResult } from "./types";

type User = NonNullable<Awaited<ReturnType<typeof currentUser>>>;

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Runs one AI feature for the signed-in caller, behind the kill switch and
 * the daily limit. `fn` throws `AiInputError` for bad input; any other error
 * is logged and reported as "error".
 */
export async function guarded<T>(fn: (user: User) => Promise<T>): Promise<AiResult<T>> {
  if (!aiEnabled()) return { ok: false, reason: "disabled" };
  const user = await currentUser();
  if (!user) return { ok: false, reason: "signed-out" };

  const max = user.isAnonymous ? AI_DAILY_LIMIT.guest : AI_DAILY_LIMIT.account;
  if (!(await allow(`ai:${user.id}`, max, DAY_MS))) return { ok: false, reason: "rate-limited" };

  try {
    return { ok: true, data: await fn(user) };
  } catch (err) {
    if (err instanceof AiInputError) return { ok: false, reason: "invalid" };
    console.error("AI action failed", err);
    return { ok: false, reason: "error" };
  }
}
