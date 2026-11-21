import { afterEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { aiEnabled, isMock } from "./config";
import { askModel } from "./run";

afterEach(() => vi.unstubAllEnvs());

describe("aiEnabled", () => {
  it("is off without a key", () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "");
    vi.stubEnv("AI_MOCK", "");
    expect(aiEnabled()).toBe(false);
  });

  it("is on with a key, off again with the kill switch", () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "sk-test");
    expect(aiEnabled()).toBe(true);
    vi.stubEnv("AI_ENABLED", "0");
    expect(aiEnabled()).toBe(false);
  });

  it("is on with the mock and no key", () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "");
    vi.stubEnv("AI_MOCK", "1");
    expect(isMock()).toBe(true);
    expect(aiEnabled()).toBe(true);
  });
});

describe("askModel (mock)", () => {
  const schema = z.object({ items: z.array(z.string()).max(2) });

  it("returns the validated canned answer", async () => {
    vi.stubEnv("AI_MOCK", "1");
    const out = await askModel({
      system: "s",
      prompt: "p",
      schema,
      mock: () => ({ items: ["a", "b"] }),
    });
    expect(out.items).toEqual(["a", "b"]);
  });

  it("rejects a canned answer that breaks the schema", async () => {
    vi.stubEnv("AI_MOCK", "1");
    await expect(
      askModel({ system: "s", prompt: "p", schema, mock: () => ({ items: ["a", "b", "c"] }) }),
    ).rejects.toThrow();
  });
});
