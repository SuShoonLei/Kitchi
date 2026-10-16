import { api, eatingOutFromDto, type WeekRow } from "@/lib/api";
import type { DataSource } from "@/lib/data-source";
import type { Settings, WeekSummary } from "@/lib/types";

function asWeek(row: WeekRow): WeekSummary {
  return {
    weekStart: row.weekStart,
    weekEnd: row.weekEnd,
    groceryTotal: row.groceryTotal,
    eatingOutTotal: row.eatingOutTotal,
    foodSavedCount: row.foodSavedCount,
    moneySaved: row.moneySaved,
    isCurrentWeek: row.isCurrentWeek,
    eatingOutBudget: row.eatingOutBudget,
    budgetStatus: row.budgetStatus,
    wastedCount: row.wastedCount,
    wastedCost: row.wastedCost,
  };
}

export function createApiDataSource(): DataSource {
  return {
    mode: "api",
    listIngredients: () => api.ingredients(),
    listExpiring: (days = 3) => api.expiring(days),
    createIngredient: (input) => api.createIngredient(input),
    updateIngredient: (id, patch) => api.updateIngredient(id, patch),
    deleteIngredient: (id) => api.deleteIngredient(id),
    markUsed: (id) => api.markUsed(id),
    markWasted: (id) => api.markWasted(id),
    listWeeks: async (count = 8) => (await api.weeks(count)).map(asWeek),
    getWeek: (weekStart) => api.week(weekStart),
    getSavings: () => api.savings(),
    getSettings: async () => {
      const dto = await api.settings();
      return {
        preferredCuisines: dto.cuisines,
        currency: dto.currency,
        eatingOutBudgetWeekly: dto.eatingOutBudgetWeekly,
      };
    },
    saveSettings: async (next: Settings) => {
      const dto = await api.saveSettings({
        cuisines: next.preferredCuisines,
        currency: next.currency,
        eatingOutBudgetWeekly: next.eatingOutBudgetWeekly,
      });
      return {
        preferredCuisines: dto.cuisines,
        currency: dto.currency,
        eatingOutBudgetWeekly: dto.eatingOutBudgetWeekly,
      };
    },
    deleteAccount: () => api.deleteMe(),
    listGroceryItems: () => api.groceryItems(),
    createGroceryItem: (input) => api.createGroceryItem(input),
    updateGroceryItem: (id, patch) => api.updateGroceryItem(id, patch),
    deleteGroceryItem: (id) => api.deleteGroceryItem(id),
    checkout: async (store) => {
      const trip = await api.checkout(store);
      return { total: trip.total };
    },
    listEatingOut: async () => (await api.eatingOut()).map(eatingOutFromDto),
    createEatingOut: async (input) => eatingOutFromDto(await api.createEatingOut(input)),
    updateEatingOut: async (id, entry) =>
      eatingOutFromDto(
        await api.updateEatingOut(id, {
          entryDate: entry.date,
          place: entry.place,
          amount: entry.amount,
          note: entry.note ?? "",
        }),
      ),
    deleteEatingOut: (id) => api.deleteEatingOut(id),
  };
}
