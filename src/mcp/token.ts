import { createHash, randomBytes } from "node:crypto";

export const TOKEN_PREFIX = "tc_";
export const MAX_TOKENS_PER_USER = 5;
export const LABEL_MAX = 40;

/** A new random token. It is 256 bits of randomness, so a plain hash is enough to store. */
export function newToken(): string {
  return TOKEN_PREFIX + randomBytes(32).toString("base64url");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Does it even look like one of ours? Saves a database lookup for junk. */
export const looksLikeToken = (s: string) => /^tc_[A-Za-z0-9_-]{43}$/.test(s);

/** What is shown in lists: enough to tell tokens apart, never enough to use one. */
export const tokenPrefix = (token: string) => token.slice(0, TOKEN_PREFIX.length + 6);

/** "Bearer tc_…" → the token, or null. */
export function bearerToken(header: string | null): string | null {
  const m = /^Bearer\s+(\S+)$/i.exec(header ?? "");
  return m && looksLikeToken(m[1]) ? m[1] : null;
}
