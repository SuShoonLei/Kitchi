"use client";

import { useEffect, useState } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { createId } from "@/lib/format";
import {
  createSeedEatingOut,
  createSeedGroceryList,
  createSeedGroceryTrips,
  createSeedIngredients,
  createSeedMeals,
  createSeedSettings,
} from "@/lib/seed";
import type {
  Cuisine,
  EatingOutEntry,
  GroceryItem,
  GroceryTrip,
  Ingredient,
  Meal,
  Settings,
} from "@/lib/types";

type FridgeState = {
  ingredients: Ingredient[];
  meals: Meal[];
  groceryList: GroceryItem[];
  groceryTrips: GroceryTrip[];
  eatingOut: EatingOutEntry[];
  settings: Settings;
  addIngredient: (ingredient: Omit<Ingredient, "id" | "addedAt">) => void;
  updateIngredient: (id: string, patch: Partial<Omit<Ingredient, "id">>) => void;
  removeIngredient: (id: string) => void;
  addMeal: (meal: Omit<Meal, "id" | "cookedAt"> & { cookedAt?: string }) => void;
  addGroceryItem: (item: Omit<GroceryItem, "id" | "checked">) => void;
  toggleGroceryItem: (id: string) => void;
  removeGroceryItem: (id: string) => void;
  addGroceryTrip: (trip: Omit<GroceryTrip, "id">) => void;
  addEatingOut: (entry: Omit<EatingOutEntry, "id">) => void;
  toggleCuisine: (cuisine: Cuisine) => void;
  setEatingOutBudget: (amount: number | null) => void;
  setCurrency: (currency: string) => void;
};

let journalReady: Promise<void> | null = null;

const STORAGE_KEY = "kitchi";

function ensureJournal(): Promise<void> {
  if (journalReady) return journalReady;

  if (!window.localStorage.getItem(STORAGE_KEY)) {
    const legacy = window.localStorage.getItem("fridge-rescue");
    if (legacy) window.localStorage.setItem(STORAGE_KEY, legacy);
  }

  const saved = window.localStorage.getItem(STORAGE_KEY);
  journalReady = Promise.resolve(useFridgeStore.persist.rehydrate())
    .catch(() => undefined)
    .then(() => {
      if (saved) return;
      useFridgeStore.setState({
        ingredients: createSeedIngredients(),
        meals: createSeedMeals(),
        groceryList: createSeedGroceryList(),
        groceryTrips: createSeedGroceryTrips(),
        eatingOut: createSeedEatingOut(),
        settings: createSeedSettings(),
      });
    });

  return journalReady;
}

export const useFridgeStore = create<FridgeState>()(
  persist(
    (set) => ({
      ingredients: [],
      meals: [],
      groceryList: [],
      groceryTrips: [],
      eatingOut: [],
      settings: createSeedSettings(),
      addIngredient: (ingredient) =>
        set((state) => ({
          ingredients: [
            { ...ingredient, id: createId("ing"), addedAt: new Date().toISOString() },
            ...state.ingredients,
          ],
        })),
      updateIngredient: (id, patch) =>
        set((state) => ({
          ingredients: state.ingredients.map((ingredient) =>
            ingredient.id === id ? { ...ingredient, ...patch } : ingredient,
          ),
        })),
      removeIngredient: (id) =>
        set((state) => ({
          ingredients: state.ingredients.filter((ingredient) => ingredient.id !== id),
        })),
      addMeal: (meal) =>
        set((state) => ({
          meals: [
            {
              ...meal,
              id: createId("meal"),
              cookedAt: meal.cookedAt ?? new Date().toISOString(),
            },
            ...state.meals,
          ],
        })),
      addGroceryItem: (item) =>
        set((state) => ({
          groceryList: [...state.groceryList, { ...item, id: createId("list"), checked: false }],
        })),
      toggleGroceryItem: (id) =>
        set((state) => ({
          groceryList: state.groceryList.map((item) =>
            item.id === id ? { ...item, checked: !item.checked } : item,
          ),
        })),
      removeGroceryItem: (id) =>
        set((state) => ({
          groceryList: state.groceryList.filter((item) => item.id !== id),
        })),
      addGroceryTrip: (trip) =>
        set((state) => ({
          groceryTrips: [{ ...trip, id: createId("trip") }, ...state.groceryTrips],
        })),
      addEatingOut: (entry) =>
        set((state) => ({
          eatingOut: [{ ...entry, id: createId("out") }, ...state.eatingOut],
        })),
      toggleCuisine: (cuisine) =>
        set((state) => {
          const selected = state.settings.preferredCuisines;
          const preferredCuisines = selected.includes(cuisine)
            ? selected.filter((item) => item !== cuisine)
            : [...selected, cuisine];
          return { settings: { ...state.settings, preferredCuisines } };
        }),
      setEatingOutBudget: (eatingOutBudgetWeekly) =>
        set((state) => ({
          settings: { ...state.settings, eatingOutBudgetWeekly },
        })),
      setCurrency: (currency) =>
        set((state) => ({
          settings: { ...state.settings, currency },
        })),
    }),
    {
      name: "kitchi",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
    },
  ),
);

export function useStoreReady(): boolean {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    void ensureJournal().finally(() => {
      if (active) setReady(true);
    });
    return () => {
      active = false;
    };
  }, []);

  return ready;
}
