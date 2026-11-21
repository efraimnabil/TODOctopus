"use server";

import { aiEnabled } from "./config";
import { guarded } from "./guard";
import { PARSE_MAX, isDateInput, parseTask, type ParsedTask } from "./parse";
import { splitTask, type Subtask } from "./subtasks";
import { AiInputError, type AiResult } from "./types";
import { TITLE_MAX } from "@/game/rules";

/** Whether AI features exist at all on this deployment (no key means no buttons). */
export async function aiStatus(): Promise<{ enabled: boolean }> {
  return { enabled: aiEnabled() };
}

/**
 * Reads a sentence ("call mom tomorrow, important") into a title, priority
 * and deadline. `today` is the player's own date (YYYY-MM-DD), so "tomorrow"
 * means their tomorrow. A preview: nothing is saved.
 */
export async function understandTask(text: unknown, today: unknown): Promise<AiResult<ParsedTask>> {
  return guarded(async () => {
    const sentence = typeof text === "string" ? text.trim() : "";
    if (!sentence || sentence.length > PARSE_MAX) throw new AiInputError();
    if (typeof today !== "string" || !isDateInput(today)) throw new AiInputError();
    const parsed = await parseTask(sentence, today);
    if (!parsed.title) throw new Error("empty answer");
    return parsed;
  });
}

/** Breaks one task title into a few smaller steps (a preview; nothing is saved). */
export async function suggestSubtasks(title: unknown): Promise<AiResult<Subtask[]>> {
  return guarded(async () => {
    const text = typeof title === "string" ? title.trim() : "";
    if (!text || text.length > TITLE_MAX) throw new AiInputError();
    const steps = await splitTask(text);
    if (steps.length === 0) throw new Error("empty answer");
    return steps;
  });
}
