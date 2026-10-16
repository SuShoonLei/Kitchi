import type { Page } from "@playwright/test";

export async function skipIntro(page: Page) {
  await page.addInitScript(() => {
    sessionStorage.setItem("kitchi:splash", "1");
    localStorage.setItem("kitchi:onboarded", "1");
  });
}

/** Write journal once in the page (survives reload; not re-applied by init scripts). */
export async function writeJournal(
  page: Page,
  ingredients: unknown[],
  groceryList: unknown[] = [],
) {
  await page.evaluate(
    ({ ingredients: nextIngredients, groceryList: nextGrocery }) => {
      localStorage.setItem(
        "kitchi",
        JSON.stringify({
          state: {
            ingredients: nextIngredients,
            meals: [],
            groceryList: nextGrocery,
            groceryTrips: [],
            eatingOut: [],
            settings: {
              preferredCuisines: ["Western", "Italian", "Chinese"],
              eatingOutBudgetWeekly: null,
              currency: "USD",
            },
          },
          version: 0,
        }),
      );
    },
    { ingredients, groceryList },
  );
}

export function laterExpiry(days = 7) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(12, 0, 0, 0);
  return date.toISOString();
}
