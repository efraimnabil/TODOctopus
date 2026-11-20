import "server-only";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { anonymous } from "better-auth/plugins";
import { headers } from "next/headers";
import { getDb, schema } from "@/db";
import { moveGameToUser } from "@/game/server";

const DAY = 60 * 60 * 24;

function createAuth() {
  return betterAuth({
    appName: "TODOctopus",
    // Production pins the URL; previews and local dev are matched by host.
    baseURL: process.env.BETTER_AUTH_URL ?? {
      allowedHosts: [
        "localhost:3000",
        "localhost:3001",
        // Set by Vercel on every deployment
        process.env.VERCEL_URL,
        process.env.VERCEL_BRANCH_URL,
        process.env.VERCEL_PROJECT_PRODUCTION_URL,
      ].filter((h): h is string => Boolean(h)),
      fallback: "http://localhost:3000",
    },
    database: drizzleAdapter(getDb(), {
      provider: "pg",
      schema: {
        user: schema.user,
        session: schema.session,
        account: schema.account,
        verification: schema.verification,
        rateLimit: schema.rateLimit,
      },
    }),
    emailAndPassword: { enabled: true, minPasswordLength: 8, autoSignIn: true },
    session: {
      // Guests have no way to sign back in, so their session has to last.
      // Sessions refresh daily while in use; idle guests are cleaned up after
      // 90 days by the cron job.
      expiresIn: 365 * DAY,
      updateAge: DAY,
    },
    rateLimit: {
      enabled: true,
      storage: "database",
      window: 60,
      max: 100,
      customRules: {
        "/sign-in/anonymous": { window: 60, max: 5 },
        "/sign-in/email": { window: 60, max: 10 },
        "/sign-up/email": { window: 60, max: 5 },
      },
    },
    advanced: { database: { generateId: "uuid" } },
    plugins: [
      anonymous({
        // Signing up (or in) as a guest: the guest's octopuses come along.
        onLinkAccount: async ({ anonymousUser, newUser }) => {
          await moveGameToUser(anonymousUser.user.id, newUser.user.id);
        },
      }),
      nextCookies(),
    ],
  });
}

let instance: ReturnType<typeof createAuth> | undefined;

export function getAuth() {
  instance ??= createAuth();
  return instance;
}

/** The signed-in user (guest or real) for this request, if any. */
export async function currentUser() {
  const session = await getAuth().api.getSession({ headers: await headers() });
  return session?.user ?? null;
}
