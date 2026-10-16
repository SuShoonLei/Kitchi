import { expect, test } from "@playwright/test";
import { laterExpiry, skipIntro, writeJournal } from "./helpers";

test.describe("Add missing to grocery list", () => {
  test("adds missing items, shows them on /grocery, and keeps them after reload", async ({
    page,
  }) => {
    const expires = laterExpiry(5);
    await skipIntro(page);
    await page.goto("/recipes");
    await writeJournal(page, [
      {
        id: "e1",
        name: "Eggs",
        quantity: 6,
        unit: "count",
        category: "protein",
        addedAt: new Date().toISOString(),
        expiresAt: expires,
        estimatedPrice: 3,
        status: "ACTIVE",
      },
    ]);
    await page.reload();
    await page.getByRole("button", { name: /Fridge veggie omelette/i }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.getByTestId("add-missing-grocery").click();
    await expect(page.getByTestId("grocery-toast")).toContainText(/Added 1 item/i);
    await expect(page.getByRole("link", { name: /View list/i })).toBeVisible();

    await page.getByRole("link", { name: /View list/i }).click();
    await expect(page).toHaveURL(/\/grocery/);
    await expect(page.getByText("Baby spinach")).toBeVisible();
    await expect(page.getByText(/For Fridge veggie omelette/i)).toBeVisible();

    await page.reload();
    await expect(page.getByText("Baby spinach")).toBeVisible();
    await expect(page.getByText(/For Fridge veggie omelette/i)).toBeVisible();
  });
});
