import { describe, expect, it } from "vitest";
import { TITLE_MAX } from "@/game/rules";
import { MAX_SUBTASKS, tidySubtasks } from "./subtasks";

describe("tidySubtasks", () => {
  it("trims, collapses spaces and drops blanks and duplicates", () => {
    const out = tidySubtasks([
      { title: "  Book   flights ", priority: 3 },
      { title: "book flights", priority: 1 },
      { title: "   ", priority: 2 },
      { title: "Pack", priority: 1 },
    ]);
    expect(out).toEqual([
      { title: "Book flights", priority: 3 },
      { title: "Pack", priority: 1 },
    ]);
  });

  it("keeps titles within the game's limit and at most five steps", () => {
    const long = "x".repeat(TITLE_MAX + 40);
    const many = Array.from({ length: 9 }, (_, i) => ({ title: `${long}${i}`.slice(-70) + i, priority: 2 }));
    const out = tidySubtasks([{ title: long, priority: 2 }, ...many]);
    expect(out.length).toBeLessThanOrEqual(MAX_SUBTASKS);
    for (const s of out) expect(s.title.length).toBeLessThanOrEqual(TITLE_MAX);
  });

  it("keeps Arabic text intact", () => {
    expect(tidySubtasks([{ title: "احجز التذاكر", priority: 2 }])[0].title).toBe("احجز التذاكر");
  });
});
