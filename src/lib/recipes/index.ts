import recipesData from "../../../frontend/data/recipes.json";
import type { Recipe, RecipesFile } from "@/lib/recipes/types";

export type {
  Cuisine,
  Recipe,
  RecipeDifficulty,
  RecipeIngredient,
  RecipesFile,
} from "@/lib/recipes/types";
export { CUISINES, RECIPE_DIFFICULTIES } from "@/lib/recipes/types";
export {
  isStapleName,
  listSynonyms,
  listVocabulary,
  normalizeIngredientName,
  suggestIngredientNames,
  vocabularySize,
} from "@/lib/recipes/vocabulary";
export { rankRecipes } from "@/lib/recipes/rank";
export type { RankedRecipe, RankPreferences, MatchedIngredient } from "@/lib/recipes/rank";

const file = recipesData as RecipesFile;

/** Bundled recipe catalog (same JSON for local and api editions). */
export function listRecipes(): readonly Recipe[] {
  return file.recipes;
}

export function getRecipeById(id: string): Recipe | undefined {
  return file.recipes.find((recipe) => recipe.id === id);
}
