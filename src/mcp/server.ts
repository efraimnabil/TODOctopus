import "server-only";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { loadGame, runCommand } from "@/game/server";
import { RuleError, TITLE_MAX, computeStats, pickName } from "@/game/rules";
import { PRIORITY_NAMES, endOfDayAt, priorityOf, taskView } from "./format";

const text = (value: unknown): CallToolResult => ({
  content: [{ type: "text", text: typeof value === "string" ? value : JSON.stringify(value, null, 2) }],
});
const fail = (message: string): CallToolResult => ({ isError: true, content: [{ type: "text", text: message }] });

/**
 * The game as MCP tools, for one signed-in player. Every change goes through
 * `runCommand`, so the same rules and per-player lock apply as in the browser.
 */
export function createMcpServer(userId: string): McpServer {
  const server = new McpServer({ name: "todoctopus", version: "1.0.0" });

  server.registerTool(
    "list_tasks",
    {
      title: "List tasks",
      description:
        "List the player's tasks (each is a tentacle of an octopus). Defaults to open tasks, most urgent first.",
      inputSchema: { status: z.enum(["open", "done", "all"]).default("open") },
      annotations: { readOnlyHint: true },
    },
    async ({ status }) => {
      const game = await loadGame(userId);
      const now = Date.now();
      const rows = game.tasks
        .filter((t) => t.status !== "removed" && (status === "all" || t.status === status))
        .map((t) => taskView(t, game.octopuses, now))
        .sort(
          (a, b) =>
            Number(b.overdue) - Number(a.overdue) ||
            PRIORITY_NAMES.indexOf(b.priority) - PRIORITY_NAMES.indexOf(a.priority),
        );
      return text({ count: rows.length, tasks: rows });
    },
  );

  server.registerTool(
    "add_task",
    {
      title: "Add a task",
      description:
        "Add a task. It grows a new tentacle on the current octopus (or summons a new octopus when all arms are taken).",
      inputSchema: {
        title: z.string().min(1).max(TITLE_MAX),
        priority: z.enum(PRIORITY_NAMES).default("medium"),
        due: z.string().optional().describe("Deadline as YYYY-MM-DD (end of that day)"),
        utc_offset_minutes: z
          .number()
          .int()
          .min(-840)
          .max(840)
          .default(0)
          .describe("The player's UTC offset in minutes, for the deadline (Cairo is 120)"),
      },
    },
    async ({ title, priority, due, utc_offset_minutes }) => {
      let dueAt: number | null = null;
      if (due !== undefined) {
        dueAt = endOfDayAt(due, utc_offset_minutes);
        if (dueAt === null) return fail("`due` must be a real date written YYYY-MM-DD.");
      }
      const game = await loadGame(userId);
      const taskId = crypto.randomUUID();
      try {
        const events = await runCommand(userId, {
          type: "addTask",
          taskId,
          input: { title, description: "", priority: priorityOf(priority), dueAt },
          at: Date.now(),
          spawn: {
            id: crypto.randomUUID(),
            name: pickName(game, Math.random()),
            seed: Math.floor(Math.random() * 10_000),
          },
        });
        const spawned = events.find((e) => e.type === "spawned");
        return text({
          added: taskId,
          title: title.trim(),
          ...(spawned ? { summonedOctopus: spawned.octopus.name } : {}),
        });
      } catch (err) {
        if (err instanceof RuleError) return fail(`The game refused that: ${err.code}.`);
        throw err;
      }
    },
  );

  server.registerTool(
    "slash_task",
    {
      title: "Slash (finish) a task",
      description:
        "Finish a task by slashing its tentacle. Slashing an octopus's last tentacle defeats it.",
      inputSchema: { task_id: z.uuid() },
      annotations: { destructiveHint: false, idempotentHint: true },
    },
    async ({ task_id }) => {
      try {
        const events = await runCommand(userId, {
          type: "completeTask",
          taskId: task_id,
          at: Date.now(),
          cutIndex: null,
        });
        const defeated = events.find((e) => e.type === "defeated");
        return text({
          slashed: task_id,
          ...(defeated ? { defeatedOctopus: defeated.octopus.name } : {}),
        });
      } catch (err) {
        if (err instanceof RuleError) {
          return fail(
            err.code === "task-not-found"
              ? "No such task. Use list_tasks to see the ids."
              : "That task is already finished or removed.",
          );
        }
        throw err;
      }
    },
  );

  server.registerTool(
    "list_octopuses",
    {
      title: "List octopuses",
      description: "List the player's octopuses with how many tentacles each has left.",
      inputSchema: {},
      annotations: { readOnlyHint: true },
    },
    async () => {
      const game = await loadGame(userId);
      return text(
        game.octopuses.map((o) => ({
          name: o.name,
          status: o.status,
          openTasks: game.tasks.filter((t) => t.octopusId === o.id && t.status === "open").length,
          slashed: game.tasks.filter((t) => t.octopusId === o.id && t.status === "done").length,
        })),
      );
    },
  );

  server.registerTool(
    "get_stats",
    {
      title: "Get stats",
      description: "Octopuses defeated, tasks finished and the current streak in days (streak days are UTC).",
      inputSchema: {},
      annotations: { readOnlyHint: true },
    },
    async () => text(computeStats(await loadGame(userId), Date.now())),
  );

  return server;
}
