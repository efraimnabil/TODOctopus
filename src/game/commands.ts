import { z } from "zod";
import { taskInputSchema, taskPatchSchema, type GameCommand } from "./rules";

const id = z.uuid();
const time = z.number().int().nonnegative();

/**
 * The shape of a command arriving from a browser. Checks the shape only:
 * the rules decide whether it's allowed, against the caller's own game.
 */
export const commandSchema: z.ZodType<GameCommand> = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("addTask"),
    taskId: id,
    input: taskInputSchema,
    at: time,
    spawn: z.object({
      id,
      name: z.string().trim().min(1).max(40),
      seed: z.number().int().min(0).max(1_000_000),
    }),
  }),
  z.object({ type: z.literal("editTask"), taskId: id, patch: taskPatchSchema }),
  z.object({
    type: z.literal("completeTask"),
    taskId: id,
    at: time,
    cutIndex: z.number().int().min(0).max(64).nullable().optional(),
  }),
  z.object({ type: z.literal("removeTask"), taskId: id, at: time }),
]);

/** Client clocks may be off; a timestamp further than this from ours is replaced. */
export const MAX_CLOCK_SKEW_MS = 10 * 60 * 1000;

export function withTrustedTime(command: GameCommand, now: number): GameCommand {
  if (!("at" in command)) return command;
  return Math.abs(command.at - now) > MAX_CLOCK_SKEW_MS ? { ...command, at: now } : command;
}
