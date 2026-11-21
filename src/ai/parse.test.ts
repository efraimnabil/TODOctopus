import { describe, expect, it } from "vitest";
import { TITLE_MAX } from "@/game/rules";
import { addDays, isDateInput, tidyParsed, weekdayOf } from "./parse";

describe("dates", () => {
  it("knows the weekday of a calendar date", () => {
    expect(weekdayOf("2026-11-21")).toBe("Saturday");
    expect(weekdayOf("2000-01-01")).toBe("Saturday");
    expect(weekdayOf("2026-11-22")).toBe("Sunday");
  });

  it("adds days across month and year ends", () => {
    expect(addDays("2026-11-30", 1)).toBe("2026-12-01");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
  });

  it("rejects dates that do not exist", () => {
    expect(isDateInput("2026-02-31")).toBe(false);
    expect(isDateInput("tomorrow")).toBe(false);
    expect(isDateInput("2026-11-21")).toBe(true);
  });
});

describe("tidyParsed", () => {
  const today = "2026-11-21";

  it("keeps a valid answer", () => {
    expect(tidyParsed({ title: " Call  mom ", priority: 3, due: "2026-11-22" }, today)).toEqual({
      title: "Call mom",
      priority: 3,
      due: "2026-11-22",
    });
  });

  it("drops a deadline in the past, malformed, or absurdly far away", () => {
    for (const due of ["2026-11-20", "soon", "2099-01-01", "2026-02-31"]) {
      expect(tidyParsed({ title: "x", priority: 2, due }, today).due).toBeNull();
    }
  });

  it("allows today", () => {
    expect(tidyParsed({ title: "x", priority: 2, due: today }, today).due).toBe(today);
  });

  it("trims long titles to the game's limit", () => {
    expect(tidyParsed({ title: "y".repeat(200), priority: 1, due: null }, today).title).toHaveLength(
      TITLE_MAX,
    );
  });

  it("handles Arabic", () => {
    expect(tidyParsed({ title: "كلّم ماما", priority: 3, due: null }, today).title).toBe("كلّم ماما");
  });
});
