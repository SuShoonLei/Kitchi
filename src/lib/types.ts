export const CUISINES = [
  "Burmese",
  "Thai",
  "Korean",
  "Japanese",
  "Chinese",
  "Indian",
  "Italian",
  "Mexican",
  "Western",
  "Vietnamese",
  "Mediterranean",
] as const;

export type Cuisine = (typeof CUISINES)[number];

export const INGREDIENT_CATEGORIES = [
  "produce",
  "dairy",
  "protein",
  "grain",
  "pantry",
  "frozen",
  "other",
] as const;

export type IngredientCategory = (typeof INGREDIENT_CATEGORIES)[number];

export type ExpiryStatus = "fresh" | "soon" | "urgent";

export type Ingredient = {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category: IngredientCategory;
  addedAt: string;
  expiresAt: string;
  estimatedPrice: number;
};

export type MealIngredientUse = {
  name: string;
  quantity: number;
  unit: string;
};

export type Meal = {
  id: string;
  name: string;
  cuisine: Cuisine;
  ingredientsUsed: MealIngredientUse[];
  cookedAt: string;
  moneySaved: number;
};

export type GroceryItem = {
  id: string;
  name: string;
  quantity: number;
  checked: boolean;
  estimatedPrice: number;
};

export type GroceryTrip = {
  id: string;
  date: string;
  store: string;
  total: number;
  items: GroceryItem[];
};

export type EatingOutEntry = {
  id: string;
  date: string;
  place: string;
  amount: number;
};

export type Settings = {
  preferredCuisines: Cuisine[];
  eatingOutBudgetWeekly: number | null;
  currency: string;
};

export type WeekSummary = {
  weekStart: string;
  weekEnd: string;
  groceryTotal: number;
  eatingOutTotal: number;
  foodSavedCount: number;
  moneySaved: number;
};
