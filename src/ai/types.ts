/** What an AI server action returns. Same shape idea as `CommitResult`. */
export type AiResult<T> =
  | { ok: true; data: T }
  | {
      ok: false;
      reason: "disabled" | "signed-out" | "invalid" | "rate-limited" | "error";
    };

/** Thrown inside an AI action when the input is unusable (empty, too long). */
export class AiInputError extends Error {}
