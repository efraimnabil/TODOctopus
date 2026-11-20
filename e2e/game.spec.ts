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

  const card = page.getByRole("dialog", { name: /is gone/ });
  await expect(card).toBeVisible({ timeout: 30_000 });
  await card.getByRole("button").click();
  await saved(page);

  await page.goto("/trophies");
  await expect(page.getByRole("heading", { name: "Trophy room" })).toBeVisible();
  await expect(page.getByText("Defeat me")).toBeVisible();
  await expect(page.getByText("No trophies yet")).toHaveCount(0);
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
