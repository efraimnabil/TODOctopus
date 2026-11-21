import { OCTOPUS_NAMES } from "@/game/rules";

/** What a share card shows. Only these few facts ever go into a link. */
export interface ShareCard {
  /** One of the game's octopus names; anything else is shown as "An octopus". */
  name: string;
  slashed: number;
  streak: number;
}

export const FALLBACK_NAME = "An octopus";
const MAX_COUNT = 999;

const clamp = (n: number) => (Number.isFinite(n) ? Math.min(MAX_COUNT, Math.max(0, Math.trunc(n))) : 0);

type Params = URLSearchParams | Record<string, string | string[] | undefined>;

const first = (p: Params, key: string): string | undefined => {
  if (p instanceof URLSearchParams) return p.get(key) ?? undefined;
  const v = p[key];
  return Array.isArray(v) ? v[0] : v;
};

/**
 * Reads a card from a link's query. Names must be the game's own, and counts
 * are clamped, so a crafted link can't put arbitrary text on our cards.
 */
export function parseShare(params: Params): ShareCard {
  const name = first(params, "n") ?? "";
  return {
    name: (OCTOPUS_NAMES as readonly string[]).includes(name) ? name : FALLBACK_NAME,
    slashed: clamp(Number(first(params, "k"))),
    streak: clamp(Number(first(params, "s"))),
  };
}

const query = (card: ShareCard) => {
  const q = new URLSearchParams({ n: card.name, k: String(clamp(card.slashed)) });
  if (card.streak > 0) q.set("s", String(clamp(card.streak)));
  return q.toString();
};

/** The page people land on: "/s?n=Octavia&k=5". It carries the card as its social image. */
export const sharePath = (card: ShareCard) => `/s?${query(card)}`;

/** The card image itself. */
export const cardImagePath = (card: ShareCard) => `/api/og?${query(card)}`;

/** "5 tentacles slashed", "1 tentacle slashed". */
export const slashedText = (n: number) => `${n} ${n === 1 ? "tentacle" : "tentacles"} slashed`;
