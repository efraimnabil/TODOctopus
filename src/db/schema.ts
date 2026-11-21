import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  check,
  index,
  integer,
  pgTable,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

// ── Better Auth tables ─────────────────────────────────────────────────────
// Field names follow Better Auth's core schema (+ the anonymous plugin's
// isAnonymous); columns are snake_case.

/** Better Auth (generateId: "uuid") leaves ids to the database. */
const authId = () =>
  text("id")
    .primaryKey()
    .default(sql`gen_random_uuid()::text`);

const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const updatedAt = () =>
  timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date());

export const user = pgTable("user", {
  id: authId(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  isAnonymous: boolean("is_anonymous").notNull().default(false),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const session = pgTable(
  "session",
  {
    id: authId(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    token: text("token").notNull().unique(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("session_user_id_idx").on(t.userId)],
);

export const account = pgTable(
  "account",
  {
    id: authId(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
    scope: text("scope"),
    password: text("password"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("account_user_id_idx").on(t.userId)],
);

export const verification = pgTable(
  "verification",
  {
    id: authId(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("verification_identifier_idx").on(t.identifier)],
);

/** Shared by Better Auth's limiter and the game's write limiter. */
export const rateLimit = pgTable("rate_limit", {
  id: authId(),
  key: text("key").notNull().unique(),
  count: integer("count").notNull(),
  lastRequest: bigint("last_request", { mode: "number" }).notNull(),
});

// ── Game tables ────────────────────────────────────────────────────────────

export const octopus = pgTable(
  "octopus",
  {
    id: uuid("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    seed: integer("seed").notNull(),
    status: text("status", { enum: ["alive", "defeated"] }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    defeatedAt: timestamp("defeated_at", { withTimezone: true }),
  },
  (t) => [
    index("octopus_user_id_idx").on(t.userId),
    check("octopus_status_check", sql`${t.status} in ('alive', 'defeated')`),
  ],
);

export const task = pgTable(
  "task",
  {
    id: uuid("id").primaryKey(),
    octopusId: uuid("octopus_id")
      .notNull()
      .references(() => octopus.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    slot: smallint("slot").notNull(),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    priority: smallint("priority").notNull(),
    status: text("status", { enum: ["open", "done", "removed"] }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    cutIndex: smallint("cut_index"),
    dueAt: timestamp("due_at", { withTimezone: true }),
  },
  (t) => [
    index("task_user_id_idx").on(t.userId),
    // One live tentacle per slot; removed tasks give their slot back.
    uniqueIndex("task_octopus_slot_live_idx")
      .on(t.octopusId, t.slot)
      .where(sql`${t.status} <> 'removed'`),
    check("task_slot_check", sql`${t.slot} between 0 and 7`),
    check("task_priority_check", sql`${t.priority} between 1 and 3`),
    check("task_status_check", sql`${t.status} in ('open', 'done', 'removed')`),
  ],
);

// ── API tokens (for the MCP server) ────────────────────────────────────────

/**
 * Personal access tokens. Only a SHA-256 hash is stored; the token itself is
 * shown once, when it is created.
 */
export const apiToken = pgTable(
  "api_token",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    label: text("label").notNull(),
    /** First characters of the token, so people can tell tokens apart */
    prefix: text("prefix").notNull(),
    tokenHash: text("token_hash").notNull().unique(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
  },
  (t) => [index("api_token_user_id_idx").on(t.userId)],
);
