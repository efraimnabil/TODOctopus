import { describe, expect, it } from "vitest";
import { MAX_CLOCK_SKEW_MS, commandSchema, withTrustedTime } from "./commands";

const uuid = "4f1c2b3a-1d2e-4f5a-8b6c-7d8e9f0a1b2c";
const add = {
  type: "addTask",
  taskId: uuid,
  input: { title: "Call mom", priority: 2 },
  at: 1_000,
  spawn: { id: uuid, name: "Octavia", seed: 3 },
};

describe("command schema", () => {
  it("accepts a well-formed command and fills defaults", () => {
    const parsed = commandSchema.parse(add);
    expect(parsed).toMatchObject({ input: { title: "Call mom", description: "" } });
  });

  it("rejects bad ids, unknown types and bad input", () => {
    expect(commandSchema.safeParse({ ...add, taskId: "t1" }).success).toBe(false);
    expect(commandSchema.safeParse({ ...add, type: "dropTable" }).success).toBe(false);
    expect(commandSchema.safeParse({ ...add, input: { title: "", priority: 2 } }).success).toBe(false);
    expect(commandSchema.safeParse({ ...add, spawn: { ...add.spawn, seed: -1 } }).success).toBe(false);
  });

  it("replaces a timestamp from a badly skewed clock", () => {
    const now = 10 * MAX_CLOCK_SKEW_MS;
    const cmd = commandSchema.parse({ type: "removeTask", taskId: uuid, at: 5 });
    expect(withTrustedTime(cmd, now)).toMatchObject({ at: now });
    const close = commandSchema.parse({ type: "removeTask", taskId: uuid, at: now - 1000 });
    expect(withTrustedTime(close, now)).toBe(close);
  });
});
