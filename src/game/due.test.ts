import { describe, expect, it } from "vitest";
import { dueLabel, endOfDay, isOverdue, toDateInput } from "./due";

const noon = new Date(2026, 10, 21, 12).getTime();

describe("due dates", () => {
  it("round-trips a date input through the end of that day", () => {
    const end = endOfDay("2026-11-24")!;
    expect(toDateInput(end)).toBe("2026-11-24");
    expect(new Date(end).getHours()).toBe(23);
    expect(endOfDay("nonsense")).toBeNull();
    expect(toDateInput(null)).toBe("");
  });

  it("is overdue only while the task is open and past its deadline", () => {
    expect(isOverdue({ status: "open", dueAt: noon - 1 }, noon)).toBe(true);
    expect(isOverdue({ status: "open", dueAt: noon + 1 }, noon)).toBe(false);
    expect(isOverdue({ status: "open", dueAt: null }, noon)).toBe(false);
    expect(isOverdue({ status: "done", dueAt: noon - 1 }, noon)).toBe(false);
  });

  it("labels deadlines", () => {
    expect(dueLabel(endOfDay("2026-11-21")!, noon)).toEqual({ text: "Due today", tone: "soon" });
    expect(dueLabel(endOfDay("2026-11-22")!, noon)).toEqual({ text: "Due tomorrow", tone: "soon" });
    expect(dueLabel(endOfDay("2026-11-28")!, noon).tone).toBe("later");
    expect(dueLabel(noon - 3 * 24 * 3600 * 1000, noon)).toEqual({ text: "Overdue 3d", tone: "overdue" });
  });
});
