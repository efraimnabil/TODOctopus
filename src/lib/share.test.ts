import { describe, expect, it } from "vitest";
import { FALLBACK_NAME, cardImagePath, parseShare, sharePath, slashedText } from "./share";

describe("share links", () => {
  it("round-trips a card through the link", () => {
    const card = { name: "Kraken Jr.", slashed: 5, streak: 3 };
    const params = new URL(sharePath(card), "https://x.test").searchParams;
    expect(parseShare(params)).toEqual(card);
    expect(cardImagePath(card)).toBe("/api/og?n=Kraken+Jr.&k=5&s=3");
  });

  it("leaves the streak out when there is none", () => {
    expect(sharePath({ name: "Octavia", slashed: 1, streak: 0 })).toBe("/s?n=Octavia&k=1");
  });

  it("only accepts the game's own octopus names", () => {
    expect(parseShare(new URLSearchParams({ n: "Octavia", k: "2" })).name).toBe("Octavia");
    for (const bad of ["Efraim Nabil", "<script>", "octavia", "Octavia ", ""]) {
      expect(parseShare(new URLSearchParams({ n: bad })).name).toBe(FALLBACK_NAME);
    }
  });

  it("clamps and sanitizes the numbers", () => {
    const card = parseShare(new URLSearchParams({ n: "Octavia", k: "99999", s: "-4" }));
    expect(card.slashed).toBe(999);
    expect(card.streak).toBe(0);
    expect(parseShare(new URLSearchParams({ k: "abc" })).slashed).toBe(0);
    expect(parseShare(new URLSearchParams({ k: "2.9" })).slashed).toBe(2);
  });

  it("reads Next's searchParams objects too", () => {
    expect(parseShare({ n: ["Octavia", "x"], k: "4" })).toMatchObject({ name: "Octavia", slashed: 4 });
  });

  it("words the count", () => {
    expect(slashedText(1)).toBe("1 tentacle slashed");
    expect(slashedText(8)).toBe("8 tentacles slashed");
  });
});
