import { expect, test } from "@playwright/test";
import { PASSWORD, addTask, openGame, saved, taskRow, uniqueEmail } from "./helpers";

test.describe.configure({ mode: "serial" });

test("a guest can play without an account and keeps their tasks after a refresh", async ({
  page,
}) => {
  await openGame(page);
  await expect(page.getByRole("note")).toContainText("Add your first task");

  await addTask(page, "Water the plants");
  await expect(page.getByRole("note")).toContainText("slash");
  await saved(page);

  await page.reload();
  await expect(taskRow(page, "Water the plants")).toBeVisible();
});

test("slashing the last tentacle defeats the octopus and mounts it in the trophy room", async ({
  page,
}) => {
  await openGame(page);
  await addTask(page, "Defeat me");
  await taskRow(page, "Defeat me").getByRole("button", { name: "Slash" }).click();

  await expect(page.getByRole("link", { name: /Achievement unlocked/ })).toBeVisible();
  const card = page.getByRole("dialog", { name: /is gone/ });
  await expect(card).toBeVisible({ timeout: 30_000 });
  await card.getByRole("button", { name: "Keep going" }).click();
  await saved(page);

  await page.goto("/trophies");
  await expect(page.getByRole("heading", { name: "Trophy room" })).toBeVisible();
  await expect(page.getByText("Defeat me")).toBeVisible();
  await expect(page.getByText("No trophies yet")).toHaveCount(0);
  // The slash and the defeat earned achievements.
  await expect(page.getByRole("heading", { name: /First blood/ })).toContainText("earned");
  await expect(page.getByRole("heading", { name: /Octopus down/ })).toContainText("earned");
  await expect(page.getByRole("region", { name: "Activity" })).toContainText("1 slashed");
});

test("signing up keeps a guest's octopuses, and signing back in returns them", async ({ page }) => {
  const email = uniqueEmail();
  await openGame(page);
  await addTask(page, "Keep me safe");
  await saved(page);

  await page.getByRole("button", { name: "Save your progress" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Email").fill(email);
  await dialog.getByLabel("Password").fill(PASSWORD);
  await dialog.getByRole("button", { name: "Create account" }).click();

  await expect(page.getByRole("button", { name: "Account" })).toBeVisible();
  await expect(taskRow(page, "Keep me safe")).toBeVisible();

  await page.reload();
  await expect(taskRow(page, "Keep me safe")).toBeVisible();

  // Signing out starts a fresh, empty game…
  await page.getByRole("button", { name: "Account" }).click();
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page.getByRole("button", { name: "Account" })).toHaveCount(0);
  await expect(taskRow(page, "Keep me safe")).toHaveCount(0);

  // …and signing in brings the tasks back.
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  const signIn = page.getByRole("dialog");
  await signIn.getByLabel("Email").fill(email);
  await signIn.getByLabel("Password").fill(PASSWORD);
  await signIn.getByRole("button", { name: "Sign in", exact: true }).last().click();
  await expect(taskRow(page, "Keep me safe")).toBeVisible();
});

test("tasks can be sorted and filtered by priority", async ({ page }) => {
  await openGame(page);
  await page.getByRole("radio", { name: "High" }).click();
  await addTask(page, "Urgent thing");
  await page.getByRole("radio", { name: "Low" }).click();
  await addTask(page, "Someday thing");
  await saved(page);

  const rows = page.locator("aside ul li");
  await expect(rows.first()).toContainText("Urgent thing");

  await page.getByLabel("Sort").selectOption("newest");
  await expect(rows.first()).toContainText("Someday thing");

  await page.getByRole("group", { name: "Show priority" }).getByRole("button", { name: "High" }).click();
  await expect(taskRow(page, "Someday thing")).toHaveCount(0);
  await expect(taskRow(page, "Urgent thing")).toBeVisible();
});

test("a task with a past deadline is marked overdue and can be re-dated", async ({ page }) => {
  await openGame(page);
  await page.getByLabel("Due date").fill("2020-01-02");
  await addTask(page, "Ancient errand");
  const row = taskRow(page, "Ancient errand");
  await expect(row).toContainText("Overdue");
  await saved(page);

  await page.reload();
  await expect(taskRow(page, "Ancient errand")).toContainText("Overdue");

  await row.getByRole("button", { name: "Edit" }).click();
  const form = page.locator("aside li").filter({ has: page.getByLabel("Title") });
  await expect(form.getByLabel("Title")).toHaveValue("Ancient errand");
  await form.getByLabel("Due date").fill("2999-01-01");
  await form.getByRole("button", { name: "Save" }).click();
  await expect(taskRow(page, "Ancient errand")).not.toContainText("Overdue");
  await expect(taskRow(page, "Ancient errand")).toContainText("Due ");
});

test("tasks can be picked and slashed from the keyboard", async ({ page }) => {
  await openGame(page);
  await addTask(page, "First errand");
  await addTask(page, "Second errand");
  await page.locator("body").click({ position: { x: 700, y: 300 } });

  await page.keyboard.press("j");
  await expect(page.locator("aside li[class*=ring-brand-pink]")).toHaveCount(1);
  await page.keyboard.press("s");
  await expect(page.getByText("Slashed (1)")).toBeVisible();

  await page.keyboard.press("?");
  await expect(page.getByRole("dialog", { name: "Keyboard shortcuts" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);

  await page.keyboard.press("n");
  await expect(page.locator("#new-task")).toBeFocused();
});

test("the landing page, About and a missing page all render", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("tentacle");
  await page.getByRole("link", { name: "Let’s start" }).first().click();
  await expect(page).toHaveURL(/\/play$/);

  await page.goto("/about");
  await expect(page.getByRole("heading", { name: "About" })).toBeVisible();

  const res = await page.goto("/no-such-page");
  expect(res?.status()).toBe(404);
  await expect(page.getByText("Nothing but water here.")).toBeVisible();
});

test("the skip link and sign-in dialog work from the keyboard", async ({ page }) => {
  await page.goto("/about");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Skip to content" })).toBeFocused();

  await openGame(page);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("AI splits a task into steps after the player allows it", async ({ page }) => {
  await openGame(page);
  await addTask(page, "Start my session"); // creates the guest account
  await saved(page);

  await page.locator("#new-task").fill("Plan the trip");
  await page.getByRole("button", { name: "Split into steps" }).click();

  // Nothing is sent until the player agrees.
  await expect(page.getByRole("group", { name: "AI consent" })).toBeVisible();
  await page.getByRole("button", { name: "Allow" }).click();

  const preview = page.getByRole("group", { name: "Suggested steps" });
  await expect(preview).toBeVisible();
  await preview.getByRole("checkbox").nth(1).uncheck();
  await preview.getByRole("button", { name: "Grow 2" }).click();

  await expect(taskRow(page, "Research the options")).toBeVisible();
  await expect(taskRow(page, "Do the first step")).toBeVisible();
  await expect(taskRow(page, "Pick one and decide")).toHaveCount(0);
  await saved(page);
});

test("AI fills the form from a sentence, and the player still presses Grow", async ({ page }) => {
  await openGame(page);
  await addTask(page, "Start my session");
  await saved(page);

  await page.locator("#new-task").fill("call mom tomorrow, it's important");
  await page.getByRole("button", { name: /Fill details/ }).click();
  // Each test has a fresh browser, so the consent question comes up again.
  await page.getByRole("button", { name: "Allow" }).click();

  await expect(page.locator("#new-task")).toHaveValue("Call mom");
  await expect(page.getByRole("radio", { name: "High" })).toHaveAttribute("aria-checked", "true");
  const t = new Date();
  t.setDate(t.getDate() + 1);
  const p = (n: number) => String(n).padStart(2, "0");
  await expect(page.getByLabel("Due date")).toHaveValue(
    `${t.getFullYear()}-${p(t.getMonth() + 1)}-${p(t.getDate())}`,
  );
  // Nothing was saved yet.
  await expect(taskRow(page, "Call mom")).toHaveCount(0);

  await page.getByRole("button", { name: "Grow", exact: true }).click();
  await expect(taskRow(page, "Call mom")).toBeVisible();
  await saved(page);
});

test("voice input keeps listening through pauses and fills the form", async ({ page }) => {
  // A stand-in for the browser's recognizer that, like Chrome, hangs up on
  // its own after a pause in the middle of the sentence.
  await page.addInitScript(() => {
    localStorage.setItem("todoctopus:ai-consent", "yes");
    type Result = { isFinal: boolean; 0: { transcript: string } };
    class FakeRecognition {
      lang = "";
      continuous = false;
      interimResults = false;
      maxAlternatives = 1;
      onresult: ((e: { resultIndex: number; results: Result[] }) => void) | null = null;
      onerror: ((e: { error: string }) => void) | null = null;
      onend: (() => void) | null = null;
      static sessions = 0;
      start() {
        const n = ++FakeRecognition.sessions;
        const say = (transcript: string, isFinal: boolean, at: number) =>
          setTimeout(() => this.onresult?.({ resultIndex: 0, results: [{ isFinal, 0: { transcript } }] }), at);
        if (n === 1) {
          say("call mom", false, 100);
          say("call mom", true, 300);
          setTimeout(() => this.onend?.(), 500); // the browser gave up early
        } else {
          say("tomorrow, it's important", false, 200);
          say("tomorrow, it's important", true, 400);
        }
      }
      stop() {
        setTimeout(() => this.onend?.(), 50);
      }
      abort() {}
    }
    const w = window as unknown as Record<string, unknown>;
    w.SpeechRecognition = w.webkitSpeechRecognition = FakeRecognition;
  });
  await openGame(page);
  await addTask(page, "Start my session");
  await saved(page);

  await page.getByRole("button", { name: "Speak a task" }).click();
  await expect(page.getByRole("button", { name: "Stop listening" })).toBeVisible();
  // Words show up live, and the early hang-up doesn't end the turn.
  await expect(page.locator("#new-task")).toHaveValue("call mom tomorrow, it's important");
  await expect(page.getByRole("button", { name: "Stop listening" })).toBeVisible();

  // A couple of seconds of quiet wraps up, and Fill details reads the sentence.
  await expect(page.getByRole("button", { name: "Speak a task" })).toBeVisible({ timeout: 10_000 });
  await expect(page.locator("#new-task")).toHaveValue("Call mom");
  await expect(page.getByRole("radio", { name: "High" })).toHaveAttribute("aria-checked", "true");
});

test("the octopus talks back, and its last words come from the AI once allowed", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("todoctopus:ai-consent", "yes"));
  await openGame(page);

  await page.getByRole("button", { name: "Settings" }).click();
  await page.getByLabel("Octopus personality").selectOption("kind");
  await page.keyboard.press("Escape");
  await addTask(page, "Water the plants");
  // The speech bubble is decorative (aria-hidden) and fades after a few seconds.
  await expect(page.getByTestId("octopus-speech")).toBeVisible();

  await taskRow(page, "Water the plants").getByRole("button", { name: "Slash" }).click();
  const card = page.getByRole("dialog", { name: /is gone/ });
  await expect(card).toBeVisible({ timeout: 30_000 });
  await expect(card).toContainText("Avenge me, my beloved tentacles!");
  await card.getByRole("button", { name: "Keep going" }).click();
  await saved(page);

  // Quiet mode: no built-in line either.
  await page.getByRole("button", { name: "Settings" }).click();
  await page.getByLabel("Octopus personality").selectOption("off");
  await page.keyboard.press("Escape");
  await addTask(page, "Quiet one");
  await expect(page.getByTestId("octopus-speech")).toHaveCount(0);
});

test("What first? picks the most urgent tentacle and says why", async ({ page }) => {
  await openGame(page);
  await addTask(page, "Relax a bit");
  await page.getByRole("radio", { name: "High" }).click();
  await addTask(page, "Urgent thing");

  await page.getByRole("button", { name: "What first?" }).click();
  const advice = page.getByTestId("octopus-speech");
  await expect(advice).toContainText("Urgent thing");
  await expect(advice).toContainText("high priority");

  // The same from the keyboard, with a different tentacle picked first.
  await page.keyboard.press("Escape");
  await page.locator("body").click({ position: { x: 5, y: 5 } });
  await page.keyboard.press("w");
  await expect(page.getByTestId("octopus-speech")).toContainText("Start with");
  await saved(page);
});

test("an MCP client with a personal token can add, list and slash tasks", async ({ page, request }) => {
  // A guest has no business with tokens.
  await openGame(page);
  await addTask(page, "Start my session");
  await saved(page); // the guest account is created on the first save
  await page.goto("/settings/tokens");
  await expect(page.getByText(/Tokens are for accounts/)).toBeVisible();

  // Make an account, then a token.
  await page.goto("/play");
  await page.getByRole("button", { name: "Save your progress" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Email").fill(uniqueEmail());
  await dialog.getByLabel("Password").fill(PASSWORD);
  await dialog.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByRole("button", { name: "Account" })).toBeVisible();

  await page.getByRole("button", { name: "Account" }).click();
  await page.getByRole("link", { name: "API tokens" }).click();
  await page.getByLabel("Token name").fill("e2e client");
  await page.getByRole("button", { name: "Create" }).click();
  const token = (await page.getByRole("region", { name: "New token" }).locator("code").first().textContent())!.trim();
  expect(token).toMatch(/^tc_[A-Za-z0-9_-]{43}$/);
  await expect(page.getByText("e2e client").first()).toBeVisible();

  const call = (body: unknown, auth: string | null = `Bearer ${token}`) =>
    request.post("/api/mcp", {
      headers: {
        "content-type": "application/json",
        accept: "application/json, text/event-stream",
        ...(auth ? { authorization: auth } : {}),
      },
      data: body,
    });
  const tool = async (name: string, args: Record<string, unknown> = {}) => {
    const res = await call({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name, arguments: args } });
    expect(res.status()).toBe(200);
    const json = await res.json();
    return json.result as { isError?: boolean; content: { text: string }[] };
  };

  // No token, or a made-up one: refused.
  expect((await call({ jsonrpc: "2.0", id: 1, method: "tools/list" }, null)).status()).toBe(401);
  expect((await call({ jsonrpc: "2.0", id: 1, method: "tools/list" }, `Bearer tc_${"a".repeat(43)}`)).status()).toBe(401);

  // The tools are advertised.
  const list = await call({ jsonrpc: "2.0", id: 1, method: "tools/list" });
  expect(list.status()).toBe(200);
  const names = ((await list.json()).result.tools as { name: string }[]).map((t) => t.name);
  expect(names).toEqual(expect.arrayContaining(["list_tasks", "add_task", "slash_task", "list_octopuses", "get_stats"]));

  // Add a task from "Claude", with a deadline.
  const added = await tool("add_task", { title: "Buy milk", priority: "high", due: "2099-01-01" });
  expect(added.isError).toBeFalsy();
  const id = JSON.parse(added.content[0].text).added as string;

  const listed = JSON.parse((await tool("list_tasks")).content[0].text);
  expect(listed.tasks.map((t: { title: string }) => t.title)).toContain("Buy milk");

  // A bad date is refused politely, not with a crash.
  expect((await tool("add_task", { title: "x", due: "2026-02-31" })).isError).toBe(true);

  // The game picks it up when the player comes back to the tab.
  await page.goto("/play");
  await expect(taskRow(page, "Buy milk")).toBeVisible();

  // Slash it over MCP, and the tentacle is gone from the open list.
  const slashed = await tool("slash_task", { task_id: id });
  expect(slashed.isError).toBeFalsy();
  expect((await tool("slash_task", { task_id: id })).isError).toBe(true);
  const stats = JSON.parse((await tool("get_stats")).content[0].text);
  expect(stats.finished).toBeGreaterThanOrEqual(1);

  // Revoking stops the token working.
  await page.goto("/settings/tokens");
  await page.getByRole("button", { name: "Revoke e2e client" }).click();
  await expect(page.getByText("No tokens yet.")).toBeVisible();
  expect((await call({ jsonrpc: "2.0", id: 1, method: "tools/list" })).status()).toBe(401);
});

test("sharing a defeat links to a page whose preview is a card with the octopus's name", async ({
  page,
  request,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.addInitScript(() => Object.defineProperty(navigator, "share", { value: undefined }));
  await openGame(page);
  await addTask(page, "Share me");
  await taskRow(page, "Share me").getByRole("button", { name: "Slash" }).click();

  const card = page.getByRole("dialog", { name: /is gone/ });
  await expect(card).toBeVisible({ timeout: 30_000 });
  const name = ((await card.getByRole("heading").textContent()) ?? "").replace(" is gone", "").trim();
  await card.getByRole("button", { name: "Share" }).click();
  await expect(card.getByRole("button", { name: "Copied!" })).toBeVisible();

  const copied = await page.evaluate(() => navigator.clipboard.readText());
  const url = copied.match(/https?:\/\/\S+/)![0];
  expect(new URL(url).pathname).toBe("/s");
  expect(new URL(url).searchParams.get("n")).toBe(name);
  expect(new URL(url).searchParams.get("k")).toBe("1");

  // The link works, and its social preview is a real PNG card for that octopus.
  const path = new URL(url).pathname + new URL(url).search;
  const html = await (await request.get(path)).text();
  expect(html).toContain(`${name} was defeated`);
  const og = html.match(/property="og:image" content="([^"]+)"/)![1].replaceAll("&amp;", "&");
  const img = await request.get(new URL(og).pathname + new URL(og).search);
  expect(img.status()).toBe(200);
  expect(img.headers()["content-type"]).toBe("image/png");

  // A made-up name never reaches the card.
  const spoof = await request.get("/s?n=Hacked+Name&k=3");
  expect(await spoof.text()).not.toContain("Hacked Name");
});
