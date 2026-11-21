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

  await row.getByRole("button", { name: /Ancient errand/ }).click();
  await row.getByRole("button", { name: "Edit" }).click();
  await row.getByLabel("Due date").fill("2999-01-01");
  await row.getByRole("button", { name: "Save" }).click();
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
  await page.getByRole("button", { name: /Split with AI/ }).click();

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
