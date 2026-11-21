import "server-only";
import { anthropic } from "@ai-sdk/anthropic";
import { generateText, Output } from "ai";
import type { z } from "zod";
import { AI_MODEL, AI_TIMEOUT_MS, isMock } from "./config";

interface Request<S extends z.ZodType> {
  system: string;
  /** Untrusted user text goes here, never into `system`. */
  prompt: string;
  schema: S;
  /** What the mock answers with (tests and e2e). */
  mock: () => z.input<S>;
  maxOutputTokens?: number;
}

/**
 * Asks the model for one JSON object that matches `schema`. The model has no
 * tools: all it can do is return data, which is validated here and by the
 * game rules before anything is saved.
 */
export async function askModel<S extends z.ZodType>(req: Request<S>): Promise<z.output<S>> {
  if (isMock()) return req.schema.parse(req.mock());
  const { output } = await generateText({
    model: anthropic(AI_MODEL),
    output: Output.object({ schema: req.schema }),
    system: req.system,
    prompt: req.prompt,
    maxOutputTokens: req.maxOutputTokens ?? 400,
    abortSignal: AbortSignal.timeout(AI_TIMEOUT_MS),
  });
  return req.schema.parse(output);
}
