import "server-only";
import { and, eq, gt, lt, sql } from "drizzle-orm";
import { getDb, schema, type Db } from "@/db";
import { apply, type GameCommand, type GameEvent } from "./rules";
import type { GameState, Octopus, Task } from "./types";

type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];

const ms = (d: Date | null) => (d ? d.getTime() : null);
const date = (n: number | null) => (n === null ? null : new Date(n));

/** Everything one user owns, as the rules expect it. */
async function readGame(db: Db | Tx, userId: string): Promise<GameState> {
  const [octopuses, tasks] = await Promise.all([
    db
      .select()
      .from(schema.octopus)
      .where(eq(schema.octopus.userId, userId))
      .orderBy(schema.octopus.createdAt, schema.octopus.id),
    db
      .select()
      .from(schema.task)
      .where(eq(schema.task.userId, userId))
      .orderBy(schema.task.createdAt, schema.task.id),
  ]);
  return {
    octopuses: octopuses.map(
      (o): Octopus => ({
        id: o.id,
        name: o.name,
        seed: o.seed,
        status: o.status,
        createdAt: o.createdAt.getTime(),
        defeatedAt: ms(o.defeatedAt),
      }),
    ),
    tasks: tasks.map(
      (t): Task => ({
        id: t.id,
        octopusId: t.octopusId,
        slot: t.slot,
        title: t.title,
        description: t.description,
        priority: t.priority as Task["priority"],
        status: t.status,
        createdAt: t.createdAt.getTime(),
        completedAt: ms(t.completedAt),
        cutIndex: t.cutIndex,
        dueAt: ms(t.dueAt),
      }),
    ),
  };
}

export function loadGame(userId: string): Promise<GameState> {
  return readGame(getDb(), userId);
}

/**
 * Replays a command against the user's saved game and stores what changed.
 * Runs in one transaction holding a per-user lock, so two quick commands
 * can't both take the same slot. Throws RuleError if the rules refuse it.
 */
export async function runCommand(userId: string, command: GameCommand): Promise<void> {
  await getDb().transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${userId}))`);
    const { events } = apply(await readGame(tx, userId), command);
    for (const event of events) await write(tx, userId, event);
  });
}

async function write(tx: Tx, userId: string, event: GameEvent) {
  switch (event.type) {
    case "spawned": {
      const o = event.octopus;
      await tx.insert(schema.octopus).values({
        id: o.id,
        userId,
        name: o.name,
        seed: o.seed,
        status: o.status,
        createdAt: new Date(o.createdAt),
      });
      return;
    }
    case "grew": {
      const t = event.task;
      await tx.insert(schema.task).values({
        id: t.id,
        octopusId: t.octopusId,
        userId,
        slot: t.slot,
        title: t.title,
        description: t.description,
        priority: t.priority,
        dueAt: date(t.dueAt),
        status: t.status,
        createdAt: new Date(t.createdAt),
      });
      return;
    }
    case "edited":
    case "cut":
    case "removed": {
      const t = event.task;
      await tx
        .update(schema.task)
        .set({
          title: t.title,
          description: t.description,
          priority: t.priority,
          dueAt: date(t.dueAt),
          status: t.status,
          completedAt: date(t.completedAt),
          cutIndex: t.cutIndex,
        })
        .where(and(eq(schema.task.id, t.id), eq(schema.task.userId, userId)));
      return;
    }
    case "defeated": {
      const o = event.octopus;
      await tx
        .update(schema.octopus)
        .set({ status: o.status, defeatedAt: date(o.defeatedAt) })
        .where(and(eq(schema.octopus.id, o.id), eq(schema.octopus.userId, userId)));
      return;
    }
  }
}

/** A guest signed up or in: their octopuses now belong to the account. */
export async function moveGameToUser(fromUserId: string, toUserId: string) {
  if (fromUserId === toUserId) return;
  await getDb().transaction(async (tx) => {
    await tx
      .update(schema.octopus)
      .set({ userId: toUserId })
      .where(eq(schema.octopus.userId, fromUserId));
    await tx.update(schema.task).set({ userId: toUserId }).where(eq(schema.task.userId, fromUserId));
  });
}

/**
 * Deletes guests who haven't been seen for `days` (their octopuses go with
 * them). "Seen" = any session refreshed recently; sessions refresh daily
 * while in use.
 */
export async function deleteIdleGuests(days = 90): Promise<number> {
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const recent = getDb()
    .select({ one: sql`1` })
    .from(schema.session)
    .where(and(eq(schema.session.userId, schema.user.id), gt(schema.session.updatedAt, cutoff)));
  const deleted = await getDb()
    .delete(schema.user)
    .where(
      and(
        eq(schema.user.isAnonymous, true),
        lt(schema.user.createdAt, cutoff),
        sql`not exists (${recent})`,
      ),
    )
    .returning({ id: schema.user.id });
  return deleted.length;
}

/**
 * Fixed-window write limit per user, kept in the same table as Better
 * Auth's limiter. Returns false once `max` writes happened in `windowMs`.
 */
export async function allowWrite(userId: string, max = 120, windowMs = 60_000): Promise<boolean> {
  const now = Date.now();
  const key = `game-write:${userId}`;
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
