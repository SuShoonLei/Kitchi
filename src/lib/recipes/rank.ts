import { getExpiryStatus } from "@/lib/expiry";
import { isStapleName, normalizeIngredientName } from "@/lib/recipes/vocabulary";
import type { Recipe, RecipeIngredient } from "@/lib/recipes/types";
import type { Cuisine, Ingredient } from "@/lib/types";

export type RankPreferences = {
  preferredCuisines?: Cuisine[];
};

export type MatchedIngredient = {
  recipe: RecipeIngredient;
  pantry?: Ingredient;
  /** 0–1 how much of the needed quantity is covered */
  coverage: number;
};

export type RankedRecipe = Recipe & {
  matchPercent: number;
  haveIngredients: MatchedIngredient[];
  missingIngredients: RecipeIngredient[];
  usesExpiring: Ingredient[];
  score: number;
};

function isUsablePantryItem(item: Ingredient): boolean {
  const status = item.status ?? "ACTIVE";
  if (status === "USED" || status === "WASTED") return false;
  return true;
}

function requiredIngredients(recipe: Recipe): RecipeIngredient[] {
  return recipe.ingredients.filter((line) => !line.optional && !line.staple && !isStapleName(line.name));
}

function findBestPantryMatch(
  line: RecipeIngredient,
  pantry: readonly Ingredient[],
  claimed: Set<string>,
): { item: Ingredient; coverage: number } | null {
  const neededName = normalizeIngredientName(line.name) ?? line.name;
  let best: { item: Ingredient; coverage: number } | null = null;

  for (const item of pantry) {
    if (claimed.has(item.id)) continue;
    const haveName = normalizeIngredientName(item.name) ?? item.name;
    if (haveName.toLowerCase() !== neededName.toLowerCase()) continue;

    const needQty = line.quantity > 0 ? line.quantity : 1;
    const haveQty = item.quantity > 0 ? item.quantity : 1;
    const coverage = Math.min(1, haveQty / needQty);
    if (!best || coverage > best.coverage) {
      best = { item, coverage };
    }
  }
  return best;
}

function expiryBonus(item: Ingredient, today: Date): number {
  const status = getExpiryStatus(item.expiresAt, today);
  if (status === "urgent") return 28;
  if (status === "soon") return 14;
  return 0;
}

/**
 * Rank recipes against the current pantry. Pure — same JSON + same pantry
 * yields identical results in local and api editions.
 */
export function rankRecipes(
  pantry: readonly Ingredient[],
  recipes: readonly Recipe[],
  preferences: RankPreferences = {},
  today: Date = new Date(),
): RankedRecipe[] {
  const usable = pantry.filter(isUsablePantryItem);
  const preferred = new Set(preferences.preferredCuisines ?? []);

  const ranked = recipes.map((recipe) => {
    const required = requiredIngredients(recipe);
    const claimed = new Set<string>();
    const haveIngredients: MatchedIngredient[] = [];
    const missingIngredients: RecipeIngredient[] = [];
    const usesExpiring: Ingredient[] = [];
    let coverageSum = 0;

    for (const line of required) {
      const match = findBestPantryMatch(line, usable, claimed);
      if (!match || match.coverage <= 0) {
        missingIngredients.push(line);
        continue;
      }
      claimed.add(match.item.id);
      haveIngredients.push({ recipe: line, pantry: match.item, coverage: match.coverage });
      coverageSum += match.coverage;
      if (getExpiryStatus(match.item.expiresAt, today) !== "fresh") {
        usesExpiring.push(match.item);
      }
    }

    const matchPercent = required.length === 0 ? 1 : coverageSum / required.length;
    let score = matchPercent * 100;
    for (const item of usesExpiring) score += expiryBonus(item, today);
    if (preferred.has(recipe.cuisine)) score += 18;
    score -= missingIngredients.length * 8;

    // Staples / optionals that happen to be present don't affect percent, but
    // still surface as "have" when matched for the cook confirm UI.
    for (const line of recipe.ingredients) {
      if (!line.optional && !line.staple && !isStapleName(line.name)) continue;
      const match = findBestPantryMatch(line, usable, claimed);
      if (match) {
        claimed.add(match.item.id);
        haveIngredients.push({ recipe: line, pantry: match.item, coverage: match.coverage });
      }
    }

    return {
      ...recipe,
      matchPercent,
      haveIngredients,
      missingIngredients,
      usesExpiring,
      score,
    };
  });

  return ranked.sort((a, b) => b.score - a.score || b.matchPercent - a.matchPercent || a.name.localeCompare(b.name));
}
