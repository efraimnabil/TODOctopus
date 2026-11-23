import { expect, test, type Page } from "@playwright/test";

const SHOTS = "docs/media";

async function grow(page: Page, title: string, priority?: "High") {
  await page.locator("#new-task").fill(title);
  if (priority) await page.getByRole("radio", { name: priority }).click();
  await page.getByRole("button", { name: "Grow", exact: true }).click();
  await page.waitForTimeout(900);
}

/** Drags across a tentacle, found by its floating label (labels sit at the tips). */
async function swipeAcross(page: Page, title: string) {
  const label = page.getByText(title, { exact: true }).last();
  const box = (await label.boundingBox())!;
  const x = box.x + box.width / 2;
  const y = box.y - 28;
  await page.mouse.move(x - 90, y);
  await page.mouse.down();
  await page.mouse.move(x + 200, y, { steps: 14 });
  await page.mouse.up();
}

test("demo for the README", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("todoctopus:ai-consent", "yes");
    localStorage.setItem("todoctopus.species", "realistic");
  });
  await page.goto("/play");
  await expect(page.locator("#new-task")).toBeVisible();
  await page.waitForTimeout(1500);

  // 1. A first task, then AI splits a vague one into tentacles.
  await grow(page, "Reply to emails", "High");
  await expect(page.getByText("Saving…")).toHaveCount(0);
  await page.getByRole("radio", { name: "Medium" }).click();
  await page.locator("#new-task").fill("Plan the trip");
  await page.waitForTimeout(700);
  await page.getByRole("button", { name: "Split into steps" }).click();
  const preview = page.getByRole("group", { name: "Suggested steps" });
  await expect(preview).toBeVisible();
  await page.waitForTimeout(1400);
  await preview.getByRole("button", { name: /Grow/ }).click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${SHOTS}/play.png` });

  // 2. Ask what to do first.
  await page.getByRole("button", { name: "What first?" }).click();
  await page.waitForTimeout(2200);

  // 3. Swipe a tentacle off.
  await swipeAcross(page, "Do the first step");
  await page.waitForTimeout(1800);
  const swiped = await page.getByText("1 slashed").count();
  if (!swiped) {
    // The swipe missed this time; fall back to the list button so the clip still ends well.
    await page.locator("aside li").filter({ hasText: "Do the first step" }).getByRole("button", { name: "Slash" }).click();
    await page.waitForTimeout(1500);
  }

  // 4. Slash the rest: defeat.
  const slashButtons = page.locator("aside li").getByRole("button", { name: "Slash" });
  while ((await slashButtons.count()) > 0) {
    await slashButtons.first().click();
    await page.waitForTimeout(1100);
  }
  const card = page.getByRole("dialog", { name: /is gone/ });
  await expect(card).toBeVisible({ timeout: 30_000 });
  await page.evaluate(() => getSelection()?.removeAllRanges());
  await page.waitForTimeout(1800);
  await page.screenshot({ path: `${SHOTS}/defeat.png` });
  await page.waitForTimeout(1200);
  await card.getByRole("button", { name: /Keep going|Next octopus/ }).click();
  await page.waitForTimeout(800);

  // Screenshots of the other bodies and the trophy room.
  await grow(page, "Water the plants");
  await grow(page, "Call mom");
  await page.getByRole("button", { name: "Settings" }).click();
  await page.getByLabel("Body shape").selectOption("jellyfish");
  await page.keyboard.press("Escape");
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `${SHOTS}/jellyfish.png` });
  await page.waitForTimeout(500);
  await page.goto("/trophies");
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${SHOTS}/trophies.png` });
});
