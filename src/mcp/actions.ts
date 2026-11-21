"use server";

import { currentUser } from "@/lib/auth";
import { allow } from "@/lib/limit";
import { LABEL_MAX } from "./token";
import { createToken, listTokens, revokeToken, type TokenInfo } from "./tokens";

export type TokenResult<T> =
  | { ok: true; data: T }
  | { ok: false; reason: "signed-out" | "guest" | "invalid" | "limit" | "rate-limited" };

/** Tokens are for accounts: a guest has no way to get back in to revoke one. */
async function member(): Promise<
  | { ok: true; user: NonNullable<Awaited<ReturnType<typeof currentUser>>> }
  | { ok: false; reason: "signed-out" | "guest" }
> {
  const user = await currentUser();
  if (!user) return { ok: false, reason: "signed-out" };
  if (user.isAnonymous) return { ok: false, reason: "guest" };
  return { ok: true, user };
}

export async function listApiTokens(): Promise<TokenResult<TokenInfo[]>> {
  const m = await member();
  if (!m.ok) return m;
  return { ok: true, data: await listTokens(m.user.id) };
}

/** Makes a token. The full token is in the answer once and never again. */
export async function createApiToken(
  label: unknown,
): Promise<TokenResult<{ token: string; info: TokenInfo }>> {
  const m = await member();
  if (!m.ok) return m;
  if (typeof label !== "string" || label.length > LABEL_MAX * 2) {
    return { ok: false, reason: "invalid" };
  }
  if (!(await allow(`token-create:${m.user.id}`, 10, 60 * 60 * 1000))) {
    return { ok: false, reason: "rate-limited" };
  }
  const made = await createToken(m.user.id, label);
  return made ? { ok: true, data: made } : { ok: false, reason: "limit" };
}

export async function revokeApiToken(id: unknown): Promise<TokenResult<null>> {
  const m = await member();
  if (!m.ok) return m;
  if (typeof id !== "string" || !/^[0-9a-f-]{36}$/.test(id)) return { ok: false, reason: "invalid" };
  await revokeToken(m.user.id, id);
  return { ok: true, data: null };
}
