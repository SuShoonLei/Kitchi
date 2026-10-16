"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { api, eatingOutFromDto, type IngredientInput, type SavingsSummary, type WeekDetail, type WeekRow } from "@/lib/api";
import { isDemoMode } from "@/lib/config";
import { clearDeviceId } from "@/lib/device";
import { clearOnboarded } from "@/lib/intro";
import { getExpiryStatus } from "@/lib/expiry";
import type { Cuisine, EatingOutEntry, GroceryItem, Ingredient, Settings, WeekSummary } from "@/lib/types";
import { buildWeekSummaries } from "@/lib/week";
import { useFridgeStore, useStoreReady } from "@/store/use-fridge-store";

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

function active(items: Ingredient[]): Ingredient[] {
  return items.filter((item) => !item.status || item.status === "ACTIVE");
}

export function useIngredients() {
  const demo = isDemoMode();
  const ready = useStoreReady();
  const local = useFridgeStore((state) => state.ingredients);
  const query = useQuery({
    queryKey: ["ingredients"],
    queryFn: () => api.ingredients(),
    enabled: !demo,
  });
  if (demo) {
    return { ...query, data: ready ? active(local) : undefined, isLoading: !ready, error: null, refetch: async () => ({}) };
  }
  return query;
}

export function useExpiring() {
  const demo = isDemoMode();
  const ready = useStoreReady();
  const local = useFridgeStore((state) => state.ingredients);
  const query = useQuery({
    queryKey: ["expiring"],
    queryFn: () => api.expiring(3),
    enabled: !demo,
  });
  const demoItems = useMemo(
    () =>
      demo && ready
        ? active(local)
            .filter((item) => getExpiryStatus(item.expiresAt) !== "fresh")
            .sort((a, b) => a.expiresAt.localeCompare(b.expiresAt))
        : [],
    [demo, local, ready],
  );
  if (demo) return { ...query, data: ready ? demoItems : undefined, isLoading: !ready, error: null };
  return query;
}

export function useWeeks() {
  const demo = isDemoMode();
  const ready = useStoreReady();
  const trips = useFridgeStore((state) => state.groceryTrips);
  const eatingOut = useFridgeStore((state) => state.eatingOut);
  const meals = useFridgeStore((state) => state.meals);
  const query = useQuery({ queryKey: ["weeks"], queryFn: () => api.weeks(8), enabled: !demo });
  const summaries = useMemo(
    () => (demo && ready ? buildWeekSummaries(trips, eatingOut, meals) : []),
    [demo, eatingOut, meals, ready, trips],
  );
  if (demo) return { ...query, data: ready ? summaries : undefined, isLoading: !ready, error: null };
  return { ...query, data: query.data?.map(asWeek) };
}

export function useWeekDetail(weekStart: string | null) {
  const demo = isDemoMode();
  return useQuery({
    queryKey: ["week", weekStart],
    queryFn: () => api.week(weekStart as string),
    enabled: !demo && Boolean(weekStart),
  });
}

export function useSavings() {
  const demo = isDemoMode();
  const ready = useStoreReady();
  const meals = useFridgeStore((state) => state.meals);
  const query = useQuery({ queryKey: ["savings"], queryFn: () => api.savings(), enabled: !demo });
  if (demo) {
    const moneySaved = meals.reduce((sum, meal) => sum + meal.moneySaved, 0);
    const snapshot: SavingsSummary | undefined = ready
      ? {
          foodItemsSaved: meals.length,
          moneySaved,
          mealsCooked: meals.length,
          wastedCount: 0,
          wastedCost: 0,
          thisWeek: {
            weekStart: "",
            weekEnd: "",
            isCurrentWeek: true,
            groceryTotal: 0,
            eatingOutTotal: 0,
            foodSavedCount: 0,
            moneySaved: 0,
            wastedCount: 0,
            wastedCost: 0,
            eatingOutBudget: null,
            budgetStatus: "NO_BUDGET",
          },
          lastWeek: {
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
            budgetStatus: "NO_BUDGET",
          },
          streakDays: 0,
        }
      : undefined;
    return { ...query, data: snapshot, isLoading: !ready, error: null };
  }
  return query;
}

export function useSettings() {
  const demo = isDemoMode();
  const ready = useStoreReady();
  const local = useFridgeStore((state) => state.settings);
  const query = useQuery({ queryKey: ["settings"], queryFn: () => api.settings(), enabled: !demo });
  if (demo) {
    const data: Settings | undefined = ready ? local : undefined;
    return { ...query, data, isLoading: !ready, error: null };
  }
  return {
    ...query,
    data: query.data
      ? {
          preferredCuisines: query.data.cuisines,
          currency: query.data.currency,
          eatingOutBudgetWeekly: query.data.eatingOutBudgetWeekly,
        }
      : undefined,
  };
}

export function useGroceryItems() {
  const demo = isDemoMode();
  const ready = useStoreReady();
  const local = useFridgeStore((state) => state.groceryList);
  const query = useQuery({ queryKey: ["grocery"], queryFn: () => api.groceryItems(), enabled: !demo });
  if (demo) return { ...query, data: ready ? local : undefined, isLoading: !ready, error: null };
  return query;
}

export function useEatingOut() {
  const demo = isDemoMode();
  const ready = useStoreReady();
  const local = useFridgeStore((state) => state.eatingOut);
  const query = useQuery({ queryKey: ["eating-out"], queryFn: () => api.eatingOut(), enabled: !demo });
  if (demo) return { ...query, data: ready ? local : undefined, isLoading: !ready, error: null };
  return { ...query, data: query.data?.map(eatingOutFromDto) };
}

function refreshPantry(client: ReturnType<typeof useQueryClient>) {
  void client.invalidateQueries({ queryKey: ["ingredients"] });
  void client.invalidateQueries({ queryKey: ["expiring"] });
  void client.invalidateQueries({ queryKey: ["weeks"] });
  void client.invalidateQueries({ queryKey: ["savings"] });
}

export function useIngredientActions() {
  const demo = isDemoMode();
  const client = useQueryClient();
  const add = useFridgeStore((state) => state.addIngredient);
  const update = useFridgeStore((state) => state.updateIngredient);
  const remove = useFridgeStore((state) => state.removeIngredient);

  const create = useMutation({
    mutationFn: async (input: IngredientInput) => {
      if (demo) {
        add(input);
        return null;
      }
      return api.createIngredient(input);
    },
    onSuccess: () => refreshPantry(client),
  });

  const save = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<IngredientInput> }) => {
      if (demo) {
        update(id, patch);
        return null;
      }
      return api.updateIngredient(id, patch);
    },
    onSuccess: () => refreshPantry(client),
  });

  const destroy = useMutation({
    mutationFn: async (item: Ingredient) => {
      if (demo) {
        remove(item.id);
        return;
      }
      await api.deleteIngredient(item.id);
    },
    onMutate: async (item) => {
      if (demo) return {};
      await client.cancelQueries({ queryKey: ["ingredients"] });
      const previous = client.getQueryData<Ingredient[]>(["ingredients"]);
      client.setQueryData<Ingredient[]>(["ingredients"], (list) => list?.filter((row) => row.id !== item.id));
      return { previous };
    },
    onError: (_error, _item, context) => {
      if (context?.previous) client.setQueryData(["ingredients"], context.previous);
    },
    onSettled: () => refreshPantry(client),
  });

  const used = useMutation({
    mutationFn: async (item: Ingredient) => {
      if (demo) {
        update(item.id, { status: "USED" });
        return null;
      }
      return api.markUsed(item.id);
    },
    onMutate: async (item) => {
      if (demo) return {};
      await client.cancelQueries({ queryKey: ["ingredients"] });
      const previous = client.getQueryData<Ingredient[]>(["ingredients"]);
      client.setQueryData<Ingredient[]>(["ingredients"], (list) => list?.filter((row) => row.id !== item.id));
      return { previous };
    },
    onError: (_error, _item, context) => {
      if (context?.previous) client.setQueryData(["ingredients"], context.previous);
    },
    onSettled: () => refreshPantry(client),
  });

  const wasted = useMutation({
    mutationFn: async (item: Ingredient) => {
      if (demo) {
        update(item.id, { status: "WASTED" });
        return;
      }
      await api.markWasted(item.id);
    },
    onMutate: async (item) => {
      if (demo) return {};
      await client.cancelQueries({ queryKey: ["ingredients"] });
      const previous = client.getQueryData<Ingredient[]>(["ingredients"]);
      client.setQueryData<Ingredient[]>(["ingredients"], (list) => list?.filter((row) => row.id !== item.id));
      return { previous };
    },
    onError: (_error, _item, context) => {
      if (context?.previous) client.setQueryData(["ingredients"], context.previous);
    },
    onSettled: () => refreshPantry(client),
  });

  return { create, save, destroy, used, wasted, restore: demo ? add : undefined, update };
}

export function useGroceryActions() {
  const demo = isDemoMode();
  const client = useQueryClient();
  const add = useFridgeStore((state) => state.addGroceryItem);
  const update = useFridgeStore((state) => state.updateGroceryItem);
  const toggle = useFridgeStore((state) => state.toggleGroceryItem);
  const remove = useFridgeStore((state) => state.removeGroceryItem);
  const addTrip = useFridgeStore((state) => state.addGroceryTrip);
  const list = useFridgeStore((state) => state.groceryList);

  const refresh = () => {
    void client.invalidateQueries({ queryKey: ["grocery"] });
    void client.invalidateQueries({ queryKey: ["weeks"] });
  };

  const create = useMutation({
    mutationFn: async (input: { name: string; quantity: number; unit: string; estimatedPrice: number }) => {
      if (demo) {
        add(input);
        return null;
      }
      return api.createGroceryItem(input);
    },
    onSuccess: refresh,
  });

  const patch = useMutation({
    mutationFn: async ({ id, body }: { id: string; body: Partial<GroceryItem> }) => {
      if (demo) {
        if (body.checked !== undefined && Object.keys(body).length === 1) toggle(id);
        else update(id, body);
        return null;
      }
      return api.updateGroceryItem(id, body);
    },
    onSuccess: refresh,
  });

  const destroy = useMutation({
    mutationFn: async (id: string) => {
      if (demo) {
        remove(id);
        return;
      }
      await api.deleteGroceryItem(id);
    },
    onSuccess: refresh,
  });

  const checkout = useMutation({
    mutationFn: async (store: string) => {
      if (demo) {
        const checked = list.filter((item) => item.checked);
        const total = checked.reduce((sum, item) => sum + item.estimatedPrice, 0);
        addTrip({
          date: new Date().toISOString().slice(0, 10),
          store,
          total,
          items: checked,
        });
        checked.forEach((item) => remove(item.id));
        return { total };
      }
      return api.checkout(store);
    },
    onSuccess: refresh,
  });

  return { create, patch, destroy, checkout };
}

export function useEatingActions() {
  const demo = isDemoMode();
  const client = useQueryClient();
  const add = useFridgeStore((state) => state.addEatingOut);
  const update = useFridgeStore((state) => state.updateEatingOut);
  const remove = useFridgeStore((state) => state.removeEatingOut);
  const refresh = () => {
    void client.invalidateQueries({ queryKey: ["eating-out"] });
    void client.invalidateQueries({ queryKey: ["weeks"] });
  };
  const create = useMutation({
    mutationFn: async (input: { entryDate: string; place: string; amount: number; note?: string }) => {
      if (demo) {
        add({ date: input.entryDate, place: input.place, amount: input.amount, note: input.note });
        return null;
      }
      return api.createEatingOut(input);
    },
    onSuccess: refresh,
  });
  const save = useMutation({
    mutationFn: async ({ id, entry }: { id: string; entry: EatingOutEntry }) => {
      if (demo) {
        update(id, entry);
        return null;
      }
      return api.updateEatingOut(id, {
        entryDate: entry.date,
        place: entry.place,
        amount: entry.amount,
        note: entry.note ?? "",
      });
    },
    onSuccess: refresh,
  });
  const destroy = useMutation({
    mutationFn: async (id: string) => {
      if (demo) {
        remove(id);
        return;
      }
      await api.deleteEatingOut(id);
    },
    onSuccess: refresh,
  });
  return { create, save, destroy };
}

export function useSaveSettings() {
  const demo = isDemoMode();
  const client = useQueryClient();
  const setBudget = useFridgeStore((state) => state.setEatingOutBudget);
  const setCurrency = useFridgeStore((state) => state.setCurrency);
  const toggle = useFridgeStore((state) => state.toggleCuisine);
  const current = useFridgeStore((state) => state.settings);
  return useMutation({
    mutationFn: async (next: Settings) => {
      if (demo) {
        if (next.currency !== current.currency) setCurrency(next.currency);
        if (next.eatingOutBudgetWeekly !== current.eatingOutBudgetWeekly) setBudget(next.eatingOutBudgetWeekly);
        const added = next.preferredCuisines.filter((cuisine) => !current.preferredCuisines.includes(cuisine));
        const removed = current.preferredCuisines.filter((cuisine) => !next.preferredCuisines.includes(cuisine));
        [...added, ...removed].forEach((cuisine: Cuisine) => toggle(cuisine));
        return null;
      }
      return api.saveSettings({
        cuisines: next.preferredCuisines,
        currency: next.currency,
        eatingOutBudgetWeekly: next.eatingOutBudgetWeekly,
      });
    },
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ["settings"] });
      void client.invalidateQueries({ queryKey: ["weeks"] });
    },
  });
}

export function useDeleteAccount() {
  const demo = isDemoMode();
  const client = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!demo) await api.deleteMe();
      clearDeviceId();
      clearOnboarded((key) => window.localStorage.removeItem(key));
      delete document.documentElement.dataset.kitchiOnboarded;
      if (demo) window.localStorage.removeItem("kitchi");
    },
    onSuccess: () => {
      client.clear();
      // A full reload drops the cleared device id and the query cache together.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.href = `${window.location.origin}/`;
    },
  });
}

export type { WeekDetail };
