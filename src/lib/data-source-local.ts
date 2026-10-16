import { parseISO } from "date-fns";
import type { IngredientInput, SavingsSummary } from "@/lib/api";
import type { DataSource } from "@/lib/data-source";
import { getExpiryStatus } from "@/lib/expiry";
import type { Ingredient, Settings } from "@/lib/types";
import { buildWeekSummaries, weekKey } from "@/lib/week";
import { useFridgeStore } from "@/store/use-fridge-store";

function active(items: Ingredient[]): Ingredient[] {
  return items.filter((item) => !item.status || item.status === "ACTIVE");
}

function store() {
  return useFridgeStore.getState();
}

export function createLocalDataSource(): DataSource {
  return {
    mode: "local",
    listIngredients: async () => active(store().ingredients),
    listExpiring: async () =>
      active(store().ingredients)
        .filter((item) => getExpiryStatus(item.expiresAt) !== "fresh")
        .sort((a, b) => a.expiresAt.localeCompare(b.expiresAt)),
    createIngredient: async (input: IngredientInput) => {
      store().addIngredient(input);
      return null;
    },
    updateIngredient: async (id, patch) => {
      store().updateIngredient(id, patch);
      return null;
    },
    deleteIngredient: async (id) => {
      store().removeIngredient(id);
    },
    markUsed: async (id) => {
      store().updateIngredient(id, { status: "USED" });
      return null;
    },
    markWasted: async (id) => {
      store().updateIngredient(id, { status: "WASTED" });
      return null;
    },
    listWeeks: async () => {
      const state = store();
      return buildWeekSummaries(state.groceryTrips, state.eatingOut, state.meals);
    },
    getWeek: async (weekStart) => {
      const state = store();
      const summaries = buildWeekSummaries(state.groceryTrips, state.eatingOut, state.meals);
      const summary = summaries.find((row) => row.weekStart === weekStart);
      if (!summary) return null;
      return {
        ...summary,
        isCurrentWeek: summary.isCurrentWeek ?? false,
        wastedCount: summary.wastedCount ?? 0,
        wastedCost: summary.wastedCost ?? 0,
        eatingOutBudget: summary.eatingOutBudget ?? null,
        budgetStatus: summary.budgetStatus ?? "NO_BUDGET",
        trips: state.groceryTrips
          .filter((trip) => weekKey(parseISO(trip.date)) === weekStart)
          .map((trip) => ({
            id: trip.id,
            tripDate: trip.date,
            store: trip.store,
            total: trip.total,
            items: trip.items.map((item) => ({
              id: item.id,
              name: item.name,
              quantity: item.quantity,
              price: item.estimatedPrice,
            })),
          })),
        eatingOut: state.eatingOut
          .filter((entry) => weekKey(parseISO(entry.date)) === weekStart)
          .map((entry) => ({
            id: entry.id,
            entryDate: entry.date,
            place: entry.place,
            amount: entry.amount,
            note: entry.note ?? null,
          })),
        meals: state.meals
          .filter((meal) => weekKey(parseISO(meal.cookedAt)) === weekStart)
          .map((meal) => ({
            id: meal.id,
            name: meal.name,
            cuisine: meal.cuisine,
            cookedAt: meal.cookedAt,
            moneySaved: meal.moneySaved,
            ingredients: meal.ingredientsUsed.map((line) => ({
              ingredientId: "",
              name: line.name,
              quantityUsed: line.quantity,
              unit: line.unit,
            })),
          })),
      };
    },
    getSavings: async () => {
      const meals = store().meals;
      const moneySaved = meals.reduce((sum, meal) => sum + meal.moneySaved, 0);
      const emptyWeek = {
        weekStart: "",
        weekEnd: "",
        isCurrentWeek: false,
        groceryTotal: 0,
        eatingOutTotal: 0,
        foodSavedCount: 0,
        moneySaved: 0,
        wastedCount: 0,
        wastedCost: 0,
        eatingOutBudget: null,
        budgetStatus: "NO_BUDGET" as const,
      };
      const snapshot: SavingsSummary = {
        foodItemsSaved: meals.length,
        moneySaved,
        mealsCooked: meals.length,
        wastedCount: 0,
        wastedCost: 0,
        thisWeek: { ...emptyWeek, isCurrentWeek: true },
        lastWeek: emptyWeek,
        streakDays: 0,
      };
      return snapshot;
    },
    getSettings: async () => store().settings,
    saveSettings: async (next: Settings) => {
      const state = store();
      const current = state.settings;
      if (next.currency !== current.currency) state.setCurrency(next.currency);
      if (next.eatingOutBudgetWeekly !== current.eatingOutBudgetWeekly) {
        state.setEatingOutBudget(next.eatingOutBudgetWeekly);
      }
      const added = next.preferredCuisines.filter((cuisine) => !current.preferredCuisines.includes(cuisine));
      const removed = current.preferredCuisines.filter((cuisine) => !next.preferredCuisines.includes(cuisine));
      [...added, ...removed].forEach((cuisine) => state.toggleCuisine(cuisine));
      return null;
    },
    deleteAccount: async () => {
      window.localStorage.removeItem("kitchi");
    },
    listGroceryItems: async () => store().groceryList,
    createGroceryItem: async (input) => {
      store().addGroceryItem(input);
      return null;
    },
    updateGroceryItem: async (id, patch) => {
      if (patch.checked !== undefined && Object.keys(patch).length === 1) store().toggleGroceryItem(id);
      else store().updateGroceryItem(id, patch);
      return null;
    },
    deleteGroceryItem: async (id) => {
      store().removeGroceryItem(id);
    },
    checkout: async (storeName) => {
      const state = store();
      const checked = state.groceryList.filter((item) => item.checked);
      const total = checked.reduce((sum, item) => sum + item.estimatedPrice, 0);
      state.addGroceryTrip({
        date: new Date().toISOString().slice(0, 10),
        store: storeName,
        total,
        items: checked,
      });
      checked.forEach((item) => state.removeGroceryItem(item.id));
      return { total };
    },
    listEatingOut: async () => store().eatingOut,
    createEatingOut: async (input) => {
      store().addEatingOut({
        date: input.entryDate,
        place: input.place,
        amount: input.amount,
        note: input.note,
      });
      return null;
    },
    updateEatingOut: async (id, entry) => {
      store().updateEatingOut(id, entry);
      return null;
    },
    deleteEatingOut: async (id) => {
      store().removeEatingOut(id);
    },
  };
}
