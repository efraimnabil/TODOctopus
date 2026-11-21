import { describe, expect, it } from "vitest";
import type { Octopus, Task } from "@/game/types";
import { endOfDayAt, nameOfPriority, priorityOf, taskView } from "./format";

describe("endOfDayAt", () => {
  it("is the end of the day in UTC by default", () => {
    expect(new Date(endOfDayAt("2026-11-30")!).toISOString()).toBe("2026-11-30T23:59:59.999Z");
  });

  it("shifts for the player's time zone", () => {
    // Cairo (UTC+2): their day ends two hours before UTC's
    expect(new Date(endOfDayAt("2026-11-30", 120)!).toISOString()).toBe("2026-11-30T21:59:59.999Z");
    expect(new Date(endOfDayAt("2026-11-30", -300)!).toISOString()).toBe("2026-12-01T04:59:59.999Z");
  });

  it("rejects dates that do not exist or are malformed", () => {
    expect(endOfDayAt("2026-02-31")).toBeNull();
    expect(endOfDayAt("tomorrow")).toBeNull();
    expect(endOfDayAt("2026-1-5")).toBeNull();
  });
});

describe("priority names", () => {
  it("round-trips", () => {
    for (const n of ["low", "medium", "high"] as const) expect(nameOfPriority(priorityOf(n))).toBe(n);
    expect(priorityOf("high")).toBe(3);
  });
});

describe("taskView", () => {
  const o = { id: "o", name: "Octavia" } as Octopus;
  const t = { id: "t", octopusId: "o", title: "Pay rent", priority: 3, status: "open", dueAt: 1000 } as Task;

  it("names the octopus and flags overdue work", () => {
    expect(taskView(t, [o], 2000)).toMatchObject({ octopus: "Octavia", priority: "high", overdue: true });
    expect(taskView(t, [o], 500).overdue).toBe(false);
    expect(taskView({ ...t, status: "done" }, [o], 2000).overdue).toBe(false);
  });
});
