"use server";

import { aiEnabled } from "./config";
import { guarded } from "./guard";
import { splitTask, type Subtask } from "./subtasks";
import { AiInputError, type AiResult } from "./types";
import { TITLE_MAX } from "@/game/rules";

/** Whether AI features exist at all on this deployment (no key means no buttons). */
export async function aiStatus(): Promise<{ enabled: boolean }> {
  return { enabled: aiEnabled() };
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
