import { expect, type Page } from "@playwright/test";

export const PASSWORD = "e2e-Passw0rd!";

export const uniqueEmail = () => `e2e-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.test`;

export async function openGame(page: Page) {
  await page.goto("/play");
  await expect(page.locator("#new-task")).toBeVisible();
}

export async function addTask(page: Page, title: string) {
  await page.locator("#new-task").fill(title);
  await page.getByRole("button", { name: "Grow" }).click();
  await expect(taskRow(page, title)).toBeVisible();
}

export const taskRow = (page: Page, title: string) =>
  page.locator("aside li").filter({ hasText: title }).first();

/** Waits until the "Saving…" indicator has gone, i.e. the server has it. */
export async function saved(page: Page) {
  await expect(page.getByText("Saving…")).toHaveCount(0);
}
