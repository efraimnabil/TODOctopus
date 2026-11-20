import "server-only";
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import * as schema from "./schema";

// Node has a global WebSocket from v22, but the ws package is the documented
// fallback for the Neon driver.
neonConfig.webSocketConstructor ??= ws;

function connect() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  return drizzle({ client: new Pool({ connectionString: url }), schema });
}

let instance: ReturnType<typeof connect> | undefined;

/** One pooled connection per server instance (supports transactions). */
export function getDb() {
  instance ??= connect();
  return instance;
}

export type Db = ReturnType<typeof getDb>;
export { schema };
