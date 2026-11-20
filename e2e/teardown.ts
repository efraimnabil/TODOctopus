import { readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { Pool, neonConfig } from "@neondatabase/serverless";
import dotenv from "dotenv";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

/** Deletes the accounts the tests made (cascades to their octopuses and tasks). */
export default async function teardown() {
  dotenv.config({ path: ".env.local", quiet: true });
  const url = process.env.DATABASE_URL;
  const marker = join(__dirname, ".run-start");
  if (!url) return;
  let since = Date.now() - 60 * 60_000;
  try {
    since = Number(readFileSync(marker, "utf8"));
  } catch {
    // fall back to the last hour
  }
  const pool = new Pool({ connectionString: url });
  try {
    const { rowCount } = await pool.query(
      `delete from "user"
       where email like 'e2e-%@example.test'
          or (is_anonymous and created_at >= to_timestamp($1 / 1000.0))`,
      [since],
    );
    console.log(`e2e cleanup: removed ${rowCount} test users`);
  } finally {
    await pool.end();
    rmSync(marker, { force: true });
  }
}
