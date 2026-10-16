import { addDays } from "date-fns";
import { describe, expect, it } from "vitest";
import { rankRecipes } from "@/lib/recipes/rank";
import type { Recipe } from "@/lib/recipes/types";
import { normalizeIngredientName, isStapleName } from "@/lib/recipes/vocabulary";
import type { Ingredient } from "@/lib/types";

const today = new Date("2026-10-15T12:00:00.000Z");

function pantry(partial: Partial<Ingredient> & Pick<Ingredient, "id" | "name">): Ingredient {
  return {
    quantity: 1,
    unit: "count",
    category: "produce",
    addedAt: today.toISOString(),
    expiresAt: addDays(today, 5).toISOString(),
    estimatedPrice: 2,
    status: "ACTIVE",
    ...partial,
  };
}

function recipe(partial: Partial<Recipe> & Pick<Recipe, "id" | "name" | "ingredients">): Recipe {
  return {
    cuisine: "Western",
    description: "test",
    timeMinutes: 20,
    servings: 2,
    difficulty: "easy",
    tags: [],
    steps: ["a", "b", "c", "d"],
    ...partial,
  };
}

describe("vocabulary synonyms and staples", () => {
  it("maps synonyms to canonical names", () => {
    expect(normalizeIngredientName("scallion")).toBe("Green onion");
    expect(normalizeIngredientName("coriander")).toBe("Cilantro");
    expect(normalizeIngredientName("capsicum")).toBe("Bell pepper");
    expect(normalizeIngredientName("aubergine")).toBe("Eggplant");
  });

  it("treats salt/oil/water as staples", () => {
    expect(isStapleName("Salt")).toBe(true);
    expect(isStapleName("Cooking oil")).toBe(true);
    expect(isStapleName("Water")).toBe(true);
    expect(isStapleName("Eggs")).toBe(false);
  });
});

describe("rankRecipes", () => {
  const omelette = recipe({
    id: "omelette",
    name: "Omelette",
    cuisine: "Western",
    tags: ["vegetarian", "quick"],
    ingredients: [
      { name: "Eggs", quantity: 2, unit: "count", optional: false, staple: false },
      { name: "Baby spinach", quantity: 1, unit: "cup", optional: false, staple: false },
      { name: "Salt", quantity: 1, unit: "tsp", optional: false, staple: true },
      { name: "Cheddar", quantity: 0.25, unit: "cup", optional: true, staple: false },
    ],
  });

  const pasta = recipe({
    id: "pasta",
    name: "Tomato pasta",
    cuisine: "Italian",
    ingredients: [
      { name: "Roma tomatoes", quantity: 2, unit: "count", optional: false, staple: false },
      { name: "Spaghetti", quantity: 200, unit: "g", optional: false, staple: false },
      { name: "Garlic", quantity: 2, unit: "clove", optional: false, staple: false },
      { name: "Olive oil", quantity: 2, unit: "tbsp", optional: false, staple: true },
    ],
  });

  it("ignores staples when scoring missing items", () => {
    const items = [pantry({ id: "1", name: "Eggs", quantity: 2 }), pantry({ id: "2", name: "Baby spinach" })];
    const [ranked] = rankRecipes(items, [omelette], {}, today);
    expect(ranked.matchPercent).toBe(1);
    expect(ranked.missingIngredients).toEqual([]);
  });

  it("does not require optional ingredients", () => {
    const items = [pantry({ id: "1", name: "Eggs", quantity: 2 }), pantry({ id: "2", name: "Baby spinach" })];
    const [ranked] = rankRecipes(items, [omelette], {}, today);
    expect(ranked.missingIngredients.find((line) => line.name === "Cheddar")).toBeUndefined();
  });

  it("matches synonyms from the pantry", () => {
    const items = [
      pantry({ id: "1", name: "spinach", quantity: 2 }),
      pantry({ id: "2", name: "Eggs", quantity: 3 }),
    ];
    const [ranked] = rankRecipes(items, [omelette], {}, today);
    expect(ranked.matchPercent).toBe(1);
  });

  it("gives a stronger bonus to urgent expiry than soon", () => {
    const base = [
      pantry({ id: "e", name: "Eggs", quantity: 2 }),
      pantry({ id: "s", name: "Baby spinach", expiresAt: addDays(today, 5).toISOString() }),
    ];
    const urgent = [
      pantry({ id: "e", name: "Eggs", quantity: 2 }),
      pantry({ id: "s", name: "Baby spinach", expiresAt: addDays(today, 0).toISOString() }),
    ];
    const soon = [
      pantry({ id: "e", name: "Eggs", quantity: 2 }),
      pantry({ id: "s", name: "Baby spinach", expiresAt: addDays(today, 2).toISOString() }),
    ];
    const scoreFresh = rankRecipes(base, [omelette], {}, today)[0].score;
    const scoreUrgent = rankRecipes(urgent, [omelette], {}, today)[0].score;
    const scoreSoon = rankRecipes(soon, [omelette], {}, today)[0].score;
    expect(scoreUrgent).toBeGreaterThan(scoreSoon);
    expect(scoreSoon).toBeGreaterThan(scoreFresh);
  });

  it("boosts preferred cuisines", () => {
    const items = [
      pantry({ id: "1", name: "Roma tomatoes", quantity: 2 }),
      pantry({ id: "2", name: "Spaghetti", quantity: 200, unit: "g" }),
      pantry({ id: "3", name: "Garlic", quantity: 2 }),
    ];
    const without = rankRecipes(items, [pasta], { preferredCuisines: ["Thai"] }, today)[0].score;
    const withBoost = rankRecipes(items, [pasta], { preferredCuisines: ["Italian"] }, today)[0].score;
    expect(withBoost).toBeGreaterThan(without);
  });

  it("ignores USED and WASTED pantry items", () => {
    const items = [
      pantry({ id: "1", name: "Eggs", quantity: 2, status: "USED" }),
      pantry({ id: "2", name: "Baby spinach", status: "WASTED" }),
    ];
    const [ranked] = rankRecipes(items, [omelette], {}, today);
    expect(ranked.matchPercent).toBe(0);
    expect(ranked.missingIngredients).toHaveLength(2);
  });

  it("supports partial quantity matches", () => {
    const items = [
      pantry({ id: "1", name: "Eggs", quantity: 1 }),
      pantry({ id: "2", name: "Baby spinach", quantity: 1 }),
    ];
    const [ranked] = rankRecipes(items, [omelette], {}, today);
    expect(ranked.matchPercent).toBeCloseTo(0.75, 5);
    expect(ranked.haveIngredients.find((row) => row.recipe.name === "Eggs")?.coverage).toBe(0.5);
  });

  it("orders higher scores first", () => {
    const items = [
      pantry({ id: "1", name: "Eggs", quantity: 2 }),
      pantry({ id: "2", name: "Baby spinach" }),
      pantry({ id: "3", name: "Roma tomatoes", quantity: 1 }),
    ];
    const ranked = rankRecipes(items, [pasta, omelette], { preferredCuisines: ["Western"] }, today);
    expect(ranked[0].id).toBe("omelette");
  });
});
