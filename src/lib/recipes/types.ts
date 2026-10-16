import { CUISINES, type Cuisine } from "@/lib/types";

export const RECIPE_DIFFICULTIES = ["easy", "medium", "hard"] as const;
export type RecipeDifficulty = (typeof RECIPE_DIFFICULTIES)[number];

export const RECIPE_TAG_HINTS = [
  "vegetarian",
  "quick",
  "one-pan",
  "one-pot",
  "spicy",
  "fresh",
] as const;

export type RecipeIngredient = {
  name: string;
  quantity: number;
  unit: string;
  optional: boolean;
  staple: boolean;
};

export type Recipe = {
  id: string;
  name: string;
  cuisine: Cuisine;
  description: string;
  timeMinutes: number;
  servings: number;
  difficulty: RecipeDifficulty;
  tags: string[];
  ingredients: RecipeIngredient[];
  steps: string[];
};

export type RecipesFile = {
  recipes: Recipe[];
};

export { CUISINES };
export type { Cuisine };
