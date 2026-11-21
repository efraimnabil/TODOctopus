"use server";

import { aiEnabled } from "./config";
import { isVoiceTone } from "@/lib/personality";
import { guarded } from "./guard";
import { PARSE_MAX, isDateInput, parseTask, type ParsedTask } from "./parse";
import { splitTask, type Subtask } from "./subtasks";
import { lastWords } from "./voice";
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

/**
 * The octopus's last words, in the player's chosen tone. A one-line extra:
 * the defeat card shows a built-in line if this fails or is unavailable.
 */
export async function octopusLastWords(
  name: unknown,
  tasks: unknown,
  tone: unknown,
): Promise<AiResult<string>> {
  return guarded(async () => {
    const titles = Array.isArray(tasks) ? tasks : null;
    if (
      typeof name !== "string" ||
      !name.trim() ||
      name.length > 40 ||
      !titles ||
      titles.length === 0 ||
      titles.length > 8 ||
      !titles.every((t) => typeof t === "string" && t.trim() && t.length <= TITLE_MAX) ||
      !isVoiceTone(tone)
    ) {
      throw new AiInputError();
    }
    return lastWords(name.trim(), titles as string[], tone);
  });
}
