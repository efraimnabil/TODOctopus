import "server-only";
import { sql } from "drizzle-orm";
import { getDb, schema } from "@/db";

/**
 * Fixed-window counter kept in the same table as Better Auth's limiter.
 * Counts this call and returns false once more than `max` calls happened
 * in the last `windowMs`.
 */
export async function allow(key: string, max: number, windowMs: number): Promise<boolean> {
  const now = Date.now();
  const [row] = await getDb()
    .insert(schema.rateLimit)
    .values({ id: crypto.randomUUID(), key, count: 1, lastRequest: now })
    .onConflictDoUpdate({
      target: schema.rateLimit.key,
      set: {
        count: sql`case when ${schema.rateLimit.lastRequest} < ${now - windowMs} then 1 else ${schema.rateLimit.count} + 1 end`,
        lastRequest: sql`case when ${schema.rateLimit.lastRequest} < ${now - windowMs} then ${now} else ${schema.rateLimit.lastRequest} end`,
      },
    })
    .returning({ count: schema.rateLimit.count });
  return row.count <= max;
}
