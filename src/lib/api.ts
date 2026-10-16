import { requireApiBaseUrl } from "@/lib/config";
import { browserTimeZone, getDeviceId } from "@/lib/device";
import type {
  BudgetStatus,
  Cuisine,
  EatingOutEntry,
  GroceryItem,
  Ingredient,
  IngredientCategory,
  IngredientStatus,
  Meal,
} from "@/lib/types";
import { ApiError, apiHeaders } from "@/lib/wire";

export type { Ingredient, GroceryItem, EatingOutEntry, Meal };

export type WeekRow = {
  weekStart: string;
  weekEnd: string;
  isCurrentWeek: boolean;
  groceryTotal: number;
  eatingOutTotal: number;
  foodSavedCount: number;
  moneySaved: number;
  wastedCount: number;
  wastedCost: number;
  eatingOutBudget: number | null;
  budgetStatus: BudgetStatus;
};

export type WeekDetail = WeekRow & {
  trips: GroceryTripDto[];
  eatingOut: EatingOutDto[];
  meals: MealDto[];
};

export type SavingsSummary = {
  foodItemsSaved: number;
  moneySaved: number;
  mealsCooked: number;
  wastedCount: number;
  wastedCost: number;
  thisWeek: WeekRow;
  lastWeek: WeekRow;
  streakDays: number;
};

export type SettingsDto = {
  cuisines: Cuisine[];
  currency: string;
  eatingOutBudgetWeekly: number | null;
};

type GroceryTripDto = {
  id: string;
  tripDate: string;
  store: string;
  total: number;
  items: { id: string; name: string; quantity: number; price: number }[];
};

type EatingOutDto = {
  id: string;
  entryDate: string;
  place: string;
  amount: number;
  note: string | null;
};

type MealDto = {
  id: string;
  name: string;
  cuisine: Cuisine;
  cookedAt: string;
  moneySaved: number;
  ingredients: { ingredientId: string; name: string; quantityUsed: number; unit: string }[];
};

export type IngredientInput = {
  name: string;
  quantity: number;
  unit: string;
  category: IngredientCategory;
  expiresAt: string;
  estimatedPrice: number;
};

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let base: string;
  try {
    base = requireApiBaseUrl();
  } catch (error) {
    throw new ApiError(0, error instanceof Error ? error.message : "API URL is not configured.", {});
  }
  let response: Response;
  try {
    response = await fetch(`${base}${path}`, {
      ...init,
      headers: {
        ...apiHeaders(getDeviceId(), browserTimeZone()),
        ...(init.body ? { "Content-Type": "application/json" } : {}),
        ...init.headers,
      },
    });
  } catch {
    throw new ApiError(0, "Kitchi can't reach the kitchen right now.", {});
  }
  if (response.status === 204) return undefined as T;
  const text = await response.text();
  const body = text ? (JSON.parse(text) as { message?: string; fieldErrors?: Record<string, string> }) : null;
  if (!response.ok) {
    throw new ApiError(response.status, body?.message ?? "Request failed", body?.fieldErrors ?? {});
  }
  return body as T;
}

export const api = {
  ingredients: (status = "ACTIVE") =>
    request<Ingredient[]>(`/api/v1/ingredients?status=${status}&sort=expiresAt`),
  expiring: (days = 3) => request<Ingredient[]>(`/api/v1/ingredients/expiring?days=${days}`),
  createIngredient: (input: IngredientInput) =>
    request<Ingredient>("/api/v1/ingredients", { method: "POST", body: JSON.stringify({ ...input, source: "MANUAL" }) }),
  updateIngredient: (id: string, patch: Partial<IngredientInput & { status: IngredientStatus }>) =>
    request<Ingredient>(`/api/v1/ingredients/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),
  deleteIngredient: (id: string) => request<void>(`/api/v1/ingredients/${id}`, { method: "DELETE" }),
  markUsed: (id: string) => request<Ingredient>(`/api/v1/ingredients/${id}/mark-used`, { method: "POST" }),
  markWasted: (id: string) => request<Ingredient>(`/api/v1/ingredients/${id}/mark-wasted`, { method: "POST" }),
  weeks: (count = 8) => request<WeekRow[]>(`/api/v1/spending/weeks?count=${count}`),
  week: (weekStart: string) => request<WeekDetail>(`/api/v1/spending/weeks/${weekStart}`),
  savings: () => request<SavingsSummary>("/api/v1/savings/summary"),
  settings: () => request<SettingsDto>("/api/v1/settings"),
  saveSettings: (body: SettingsDto) =>
    request<SettingsDto>("/api/v1/settings", { method: "PUT", body: JSON.stringify(body) }),
  deleteMe: () => request<void>("/api/v1/me", { method: "DELETE" }),
  groceryItems: () => request<GroceryItem[]>("/api/v1/grocery-items"),
  createGroceryItem: (input: { name: string; quantity: number; unit: string; estimatedPrice: number; reason?: string }) =>
    request<GroceryItem>("/api/v1/grocery-items", { method: "POST", body: JSON.stringify(input) }),
  updateGroceryItem: (id: string, patch: Partial<GroceryItem>) =>
    request<GroceryItem>(`/api/v1/grocery-items/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),
  deleteGroceryItem: (id: string) => request<void>(`/api/v1/grocery-items/${id}`, { method: "DELETE" }),
  checkout: (store: string) =>
    request<GroceryTripDto>("/api/v1/grocery-trips", { method: "POST", body: JSON.stringify({ store }) }),
  eatingOut: () => request<EatingOutDto[]>("/api/v1/eating-out"),
  createEatingOut: (input: { entryDate: string; place: string; amount: number; note?: string }) =>
    request<EatingOutDto>("/api/v1/eating-out", { method: "POST", body: JSON.stringify(input) }),
  updateEatingOut: (id: string, patch: { entryDate?: string; place?: string; amount?: number; note?: string }) =>
    request<EatingOutDto>(`/api/v1/eating-out/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),
  deleteEatingOut: (id: string) => request<void>(`/api/v1/eating-out/${id}`, { method: "DELETE" }),
};

export function eatingOutFromDto(entry: EatingOutDto): EatingOutEntry {
  return { id: entry.id, date: entry.entryDate, place: entry.place, amount: entry.amount, note: entry.note };
}
