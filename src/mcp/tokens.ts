import "server-only";
import { and, eq, lt, or, isNull, sql } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { LABEL_MAX, MAX_TOKENS_PER_USER, hashToken, newToken, tokenPrefix } from "./token";

export interface TokenInfo {
  id: string;
  label: string;
  prefix: string;
  createdAt: number;
  lastUsedAt: number | null;
}

const info = (r: typeof schema.apiToken.$inferSelect): TokenInfo => ({
  id: r.id,
  label: r.label,
  prefix: r.prefix,
  createdAt: r.createdAt.getTime(),
  lastUsedAt: r.lastUsedAt ? r.lastUsedAt.getTime() : null,
});

export async function listTokens(userId: string): Promise<TokenInfo[]> {
  const rows = await getDb()
    .select()
    .from(schema.apiToken)
    .where(eq(schema.apiToken.userId, userId))
    .orderBy(schema.apiToken.createdAt);
  return rows.map(info);
}

/** Makes a token for the user. Returns null when they already have the maximum. */
export async function createToken(
  userId: string,
  label: string,
): Promise<{ token: string; info: TokenInfo } | null> {
  const clean = label.trim().replace(/\s+/g, " ").slice(0, LABEL_MAX) || "Token";
  const token = newToken();
  return getDb().transaction(async (tx) => {
    // One create at a time per user, so the cap can't be beaten by two quick requests.
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`token:${userId}`}))`);
    const [{ n }] = await tx
      .select({ n: sql<number>`count(*)::int` })
      .from(schema.apiToken)
      .where(eq(schema.apiToken.userId, userId));
    if (n >= MAX_TOKENS_PER_USER) return null;
    const [row] = await tx
      .insert(schema.apiToken)
      .values({ userId, label: clean, prefix: tokenPrefix(token), tokenHash: hashToken(token) })
      .returning();
    return { token, info: info(row) };
  });
}

export async function revokeToken(userId: string, id: string): Promise<boolean> {
  const rows = await getDb()
    .delete(schema.apiToken)
    .where(and(eq(schema.apiToken.id, id), eq(schema.apiToken.userId, userId)))
    .returning({ id: schema.apiToken.id });
  return rows.length > 0;
}

const TOUCH_AFTER_MS = 60 * 60 * 1000;

/** Who owns this token? Also notes when it was last used (at most hourly). */
export async function userForToken(token: string): Promise<{ userId: string } | null> {
  const db = getDb();
  const hash = hashToken(token);
  const [row] = await db
    .select({ id: schema.apiToken.id, userId: schema.apiToken.userId })
    .from(schema.apiToken)
    .where(eq(schema.apiToken.tokenHash, hash))
    .limit(1);
  if (!row) return null;
  await db
    .update(schema.apiToken)
    .set({ lastUsedAt: new Date() })
    .where(
      and(
        eq(schema.apiToken.id, row.id),
        or(
          isNull(schema.apiToken.lastUsedAt),
          lt(schema.apiToken.lastUsedAt, new Date(Date.now() - TOUCH_AFTER_MS)),
        ),
      ),
    );
  return { userId: row.userId };
}
