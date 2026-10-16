import { dataMode, type DataMode } from "@/lib/config";
import type { IngredientInput, SavingsSummary, WeekDetail } from "@/lib/api";
import type {
  EatingOutEntry,
  GroceryItem,
  Ingredient,
  IngredientStatus,
  Settings,
  WeekSummary,
} from "@/lib/types";
import { createApiDataSource } from "@/lib/data-source-api";
import { createLocalDataSource } from "@/lib/data-source-local";

export type DataSourceMode = DataMode;

/**
 * Shared journal contract. Pages and hooks talk only to this interface.
 * Local and API editions must return the same DTO shapes.
 */
export type DataSource = {
  mode: DataSourceMode;
  listIngredients: () => Promise<Ingredient[]>;
  listExpiring: (days?: number) => Promise<Ingredient[]>;
  createIngredient: (input: IngredientInput) => Promise<Ingredient | null>;
  updateIngredient: (
    id: string,
    patch: Partial<IngredientInput & { status: IngredientStatus }>,
  ) => Promise<Ingredient | null>;
  deleteIngredient: (id: string) => Promise<void>;
  markUsed: (id: string) => Promise<Ingredient | null>;
  markWasted: (id: string) => Promise<Ingredient | null>;
  listWeeks: (count?: number) => Promise<WeekSummary[]>;
  getWeek: (weekStart: string) => Promise<WeekDetail | null>;
  getSavings: () => Promise<SavingsSummary>;
  getSettings: () => Promise<Settings>;
  saveSettings: (next: Settings) => Promise<Settings | null>;
  deleteAccount: () => Promise<void>;
  listGroceryItems: () => Promise<GroceryItem[]>;
  createGroceryItem: (input: {
    name: string;
    quantity: number;
    unit: string;
    estimatedPrice: number;
    reason?: string;
  }) => Promise<GroceryItem | null>;
  updateGroceryItem: (id: string, patch: Partial<GroceryItem>) => Promise<GroceryItem | null>;
  deleteGroceryItem: (id: string) => Promise<void>;
  checkout: (store: string) => Promise<{ total: number }>;
  listEatingOut: () => Promise<EatingOutEntry[]>;
  createEatingOut: (input: {
    entryDate: string;
    place: string;
    amount: number;
    note?: string;
  }) => Promise<EatingOutEntry | null>;
  updateEatingOut: (id: string, entry: EatingOutEntry) => Promise<EatingOutEntry | null>;
  deleteEatingOut: (id: string) => Promise<void>;
};

const apiSource = createApiDataSource();
const localSource = createLocalDataSource();

/** Picks the active edition. Default is local (public, zero-cost). */
export function getDataSource(): DataSource {
  return dataMode() === "api" ? apiSource : localSource;
}
