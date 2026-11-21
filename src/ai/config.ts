/** The model behind every AI feature: small, fast and cheap. */
export const AI_MODEL = "claude-haiku-5-5";

/** Calls per user per day. Guests are easy to create, so they get less. */
export const AI_DAILY_LIMIT = { guest: 10, account: 40 } as const;

export const AI_TIMEOUT_MS = 10_000;

/** `AI_MOCK=1` answers from canned data instead of calling the model (tests, e2e). */
export const isMock = () => process.env.AI_MOCK === "1";

/**
 * AI is on when there is a key (or the mock) and nobody has pulled the kill
 * switch (`AI_ENABLED=0`). With it off, every AI button is hidden.
 */
export function aiEnabled(): boolean {
  if (process.env.AI_ENABLED === "0") return false;
  return isMock() || Boolean(process.env.ANTHROPIC_API_KEY);
}
