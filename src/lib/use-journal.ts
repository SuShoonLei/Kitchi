"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import type { IngredientInput, SavingsSummary, WeekDetail } from "@/lib/api";
import { getDataSource } from "@/lib/data-source";
import { clearDeviceId } from "@/lib/device";
import { getExpiryStatus } from "@/lib/expiry";
import { clearOnboarded } from "@/lib/intro";
import type { EatingOutEntry, GroceryItem, Ingredient, Settings } from "@/lib/types";
import { buildWeekSummaries } from "@/lib/week";
import { useFridgeStore, useStoreReady } from "@/store/use-fridge-store";

function refreshPantry(client: ReturnType<typeof useQueryClient>) {
  void client.invalidateQueries({ queryKey: ["ingredients"] });
  void client.invalidateQueries({ queryKey: ["expiring"] });
  void client.invalidateQueries({ queryKey: ["weeks"] });
  void client.invalidateQueries({ queryKey: ["savings"] });
}

export function useIngredients() {
  const source = getDataSource();
  const ready = useStoreReady();
  const local = useFridgeStore((state) => state.ingredients);
  const query = useQuery({
    queryKey: ["ingredients", source.mode],
    queryFn: () => source.listIngredients(),
    enabled: source.mode === "api",
  });
  if (source.mode === "local") {
    return {
      ...query,
      data: ready ? local.filter((item) => !item.status || item.status === "ACTIVE") : undefined,
      isLoading: !ready,
      error: null,
      refetch: async () => ({}),
    };
  }
  return query;
}

export function useExpiring() {
  const source = getDataSource();
  const ready = useStoreReady();
  const local = useFridgeStore((state) => state.ingredients);
  const query = useQuery({
    queryKey: ["expiring", source.mode],
    queryFn: () => source.listExpiring(3),
    enabled: source.mode === "api",
  });
  const demoItems = useMemo(() => {
    if (source.mode !== "local" || !ready) return [];
    return local
      .filter((item) => !item.status || item.status === "ACTIVE")
      .filter((item) => getExpiryStatus(item.expiresAt) !== "fresh")
      .sort((a, b) => a.expiresAt.localeCompare(b.expiresAt));
  }, [local, ready, source.mode]);
  if (source.mode === "local") {
    return { ...query, data: ready ? demoItems : undefined, isLoading: !ready, error: null };
  }
  return query;
}

export function useWeeks() {
  const source = getDataSource();
  const ready = useStoreReady();
  const trips = useFridgeStore((state) => state.groceryTrips);
  const eatingOut = useFridgeStore((state) => state.eatingOut);
  const meals = useFridgeStore((state) => state.meals);
  const query = useQuery({
    queryKey: ["weeks", source.mode],
    queryFn: () => source.listWeeks(8),
    enabled: source.mode === "api",
  });
  const summaries = useMemo(() => {
    if (source.mode !== "local" || !ready) return [];
    return buildWeekSummaries(trips, eatingOut, meals);
  }, [eatingOut, meals, ready, source.mode, trips]);
  if (source.mode === "local") {
    return { ...query, data: ready ? summaries : undefined, isLoading: !ready, error: null };
  }
  return query;
}

export function useWeekDetail(weekStart: string | null) {
  const source = getDataSource();
  return useQuery({
    queryKey: ["week", source.mode, weekStart],
    queryFn: () => source.getWeek(weekStart as string),
    enabled: Boolean(weekStart),
  });
}

export function useSavings() {
  const source = getDataSource();
  const ready = useStoreReady();
  const meals = useFridgeStore((state) => state.meals);
  const query = useQuery({
    queryKey: ["savings", source.mode],
    queryFn: () => source.getSavings(),
    enabled: source.mode === "api",
  });
  if (source.mode === "local") {
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
  const source = getDataSource();
  const ready = useStoreReady();
  const local = useFridgeStore((state) => state.settings);
  const query = useQuery({
    queryKey: ["settings", source.mode],
    queryFn: () => source.getSettings(),
    enabled: source.mode === "api",
  });
  if (source.mode === "local") {
    const data: Settings | undefined = ready ? local : undefined;
    return { ...query, data, isLoading: !ready, error: null };
  }
  return query;
}

export function useGroceryItems() {
  const source = getDataSource();
  const ready = useStoreReady();
  const local = useFridgeStore((state) => state.groceryList);
  const query = useQuery({
    queryKey: ["grocery", source.mode],
    queryFn: () => source.listGroceryItems(),
    enabled: source.mode === "api",
  });
  if (source.mode === "local") {
    return { ...query, data: ready ? local : undefined, isLoading: !ready, error: null };
  }
  return query;
}

export function useEatingOut() {
  const source = getDataSource();
  const ready = useStoreReady();
  const local = useFridgeStore((state) => state.eatingOut);
  const query = useQuery({
    queryKey: ["eating-out", source.mode],
    queryFn: () => source.listEatingOut(),
    enabled: source.mode === "api",
  });
  if (source.mode === "local") {
    return { ...query, data: ready ? local : undefined, isLoading: !ready, error: null };
  }
  return query;
}

export function useIngredientActions() {
  const source = getDataSource();
  const client = useQueryClient();
  const live = source.mode === "api";

  const create = useMutation({
    mutationFn: (input: IngredientInput) => source.createIngredient(input),
    onSuccess: () => refreshPantry(client),
  });

  const save = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<IngredientInput> }) =>
      source.updateIngredient(id, patch),
    onSuccess: () => refreshPantry(client),
  });

  const destroy = useMutation({
    mutationFn: async (item: Ingredient) => source.deleteIngredient(item.id),
    onMutate: async (item) => {
      if (!live) return {};
      await client.cancelQueries({ queryKey: ["ingredients"] });
      const previous = client.getQueryData<Ingredient[]>(["ingredients", "api"]);
      client.setQueryData<Ingredient[]>(["ingredients", "api"], (list) =>
        list?.filter((row) => row.id !== item.id),
      );
      return { previous };
    },
    onError: (_error, _item, context) => {
      if (context?.previous) client.setQueryData(["ingredients", "api"], context.previous);
    },
    onSettled: () => refreshPantry(client),
  });

  const used = useMutation({
    mutationFn: async (item: Ingredient) => source.markUsed(item.id),
    onMutate: async (item) => {
      if (!live) return {};
      await client.cancelQueries({ queryKey: ["ingredients"] });
      const previous = client.getQueryData<Ingredient[]>(["ingredients", "api"]);
      client.setQueryData<Ingredient[]>(["ingredients", "api"], (list) =>
        list?.filter((row) => row.id !== item.id),
      );
      return { previous };
    },
    onError: (_error, _item, context) => {
      if (context?.previous) client.setQueryData(["ingredients", "api"], context.previous);
    },
    onSettled: () => refreshPantry(client),
  });

  const wasted = useMutation({
    mutationFn: async (item: Ingredient) => source.markWasted(item.id),
    onMutate: async (item) => {
      if (!live) return {};
      await client.cancelQueries({ queryKey: ["ingredients"] });
      const previous = client.getQueryData<Ingredient[]>(["ingredients", "api"]);
      client.setQueryData<Ingredient[]>(["ingredients", "api"], (list) =>
        list?.filter((row) => row.id !== item.id),
      );
      return { previous };
    },
    onError: (_error, _item, context) => {
      if (context?.previous) client.setQueryData(["ingredients", "api"], context.previous);
    },
    onSettled: () => refreshPantry(client),
  });

  const restore = useMutation({
    mutationFn: (input: IngredientInput) => source.createIngredient(input),
    onSuccess: () => refreshPantry(client),
  });

  const reactivate = useMutation({
    mutationFn: (id: string) => source.updateIngredient(id, { status: "ACTIVE" }),
    onSuccess: () => refreshPantry(client),
  });

  return { create, save, destroy, used, wasted, restore, reactivate };
}

export function useGroceryActions() {
  const source = getDataSource();
  const client = useQueryClient();
  const refresh = () => {
    void client.invalidateQueries({ queryKey: ["grocery"] });
    void client.invalidateQueries({ queryKey: ["weeks"] });
  };

  const create = useMutation({
    mutationFn: (input: {
      name: string;
      quantity: number;
      unit: string;
      estimatedPrice: number;
      reason?: string;
    }) => source.createGroceryItem(input),
    onSuccess: refresh,
  });

  const patch = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<GroceryItem> }) =>
      source.updateGroceryItem(id, body),
    onSuccess: refresh,
  });

  const destroy = useMutation({
    mutationFn: (id: string) => source.deleteGroceryItem(id),
    onSuccess: refresh,
  });

  const checkout = useMutation({
    mutationFn: (storeName: string) => source.checkout(storeName),
    onSuccess: refresh,
  });

  return { create, patch, destroy, checkout };
}

export function useEatingActions() {
  const source = getDataSource();
  const client = useQueryClient();
  const refresh = () => {
    void client.invalidateQueries({ queryKey: ["eating-out"] });
    void client.invalidateQueries({ queryKey: ["weeks"] });
  };

  const create = useMutation({
    mutationFn: (input: { entryDate: string; place: string; amount: number; note?: string }) =>
      source.createEatingOut(input),
    onSuccess: refresh,
  });

  const save = useMutation({
    mutationFn: ({ id, entry }: { id: string; entry: EatingOutEntry }) =>
      source.updateEatingOut(id, entry),
    onSuccess: refresh,
  });

  const destroy = useMutation({
    mutationFn: (id: string) => source.deleteEatingOut(id),
    onSuccess: refresh,
  });

  return { create, save, destroy };
}

export function useSaveSettings() {
  const source = getDataSource();
  const client = useQueryClient();
  return useMutation({
    mutationFn: (next: Settings) => source.saveSettings(next),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ["settings"] });
      void client.invalidateQueries({ queryKey: ["weeks"] });
    },
  });
}

export function useDeleteAccount() {
  const source = getDataSource();
  const client = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await source.deleteAccount();
      clearDeviceId();
      clearOnboarded((key) => window.localStorage.removeItem(key));
      delete document.documentElement.dataset.kitchiOnboarded;
    },
    onSuccess: () => {
      client.clear();
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.href = `${window.location.origin}/`;
    },
  });
}

export type { WeekDetail };
