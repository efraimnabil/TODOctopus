import { describe, expect, it } from "vitest";
import { bearerToken, hashToken, looksLikeToken, newToken, tokenPrefix } from "./token";

describe("tokens", () => {
  it("makes unique tokens that look like ours", () => {
    const a = newToken();
    expect(looksLikeToken(a)).toBe(true);
    expect(newToken()).not.toBe(a);
  });

  it("hashes deterministically and never stores the token itself", () => {
    const t = newToken();
    expect(hashToken(t)).toBe(hashToken(t));
    expect(hashToken(t)).not.toContain(t);
    expect(hashToken(t)).toMatch(/^[0-9a-f]{64}$/);
  });

  it("shows only a short prefix", () => {
    const t = newToken();
    expect(tokenPrefix(t)).toHaveLength(9);
    expect(t.startsWith(tokenPrefix(t))).toBe(true);
  });

  it("reads a bearer header and rejects junk", () => {
    const t = newToken();
    expect(bearerToken(`Bearer ${t}`)).toBe(t);
    expect(bearerToken(`bearer ${t}`)).toBe(t);
    expect(bearerToken(t)).toBeNull();
    expect(bearerToken("Bearer nope")).toBeNull();
    expect(bearerToken(null)).toBeNull();
  });
});
