import { isStapleName, normalizeIngredientName } from "@/lib/recipes/vocabulary";
import type { RecipeIngredient } from "@/lib/recipes/types";
import type { GroceryItem } from "@/lib/types";

export type GroceryAddInput = {
  name: string;
  quantity: number;
  unit: string;
  estimatedPrice: number;
  reason: string;
};

export type MissingGroceryPlan = {
  toAdd: GroceryAddInput[];
  skippedDuplicates: string[];
  skippedStaples: string[];
  skippedOptional: string[];
};

function canonical(name: string): string {
  return (normalizeIngredientName(name) ?? name).trim().toLowerCase();
}

/** True when an open (unchecked) grocery line already covers this ingredient name. */
export function groceryAlreadyHas(
  list: readonly Pick<GroceryItem, "name" | "checked">[],
  ingredientName: string,
): boolean {
  const want = canonical(ingredientName);
  return list.some((item) => !item.checked && canonical(item.name) === want);
}

/**
 * Map recipe missing lines → grocery creates.
 * Only required, non-staple ingredients; skip unchecked list duplicates via synonyms.
 */
export function planMissingGroceryAdds(
  missing: readonly RecipeIngredient[],
  groceryList: readonly Pick<GroceryItem, "name" | "checked">[],
  recipeName: string,
): MissingGroceryPlan {
  const toAdd: GroceryAddInput[] = [];
  const skippedDuplicates: string[] = [];
  const skippedStaples: string[] = [];
  const skippedOptional: string[] = [];
  const queued = new Set<string>();

  for (const line of missing) {
    if (line.optional) {
      skippedOptional.push(line.name);
      continue;
    }
    if (line.staple || isStapleName(line.name)) {
      skippedStaples.push(line.name);
      continue;
    }
    const key = canonical(line.name);
    if (queued.has(key) || groceryAlreadyHas(groceryList, line.name)) {
      skippedDuplicates.push(line.name);
      continue;
    }
    queued.add(key);
    toAdd.push({
      name: normalizeIngredientName(line.name) ?? line.name,
      quantity: line.quantity > 0 ? line.quantity : 1,
      unit: line.unit || "count",
      estimatedPrice: 0,
      reason: `For ${recipeName}`,
    });
  }

  return { toAdd, skippedDuplicates, skippedStaples, skippedOptional };
}

export function describeMissingGroceryPlan(plan: MissingGroceryPlan): {
  kind: "added" | "duplicates" | "nothing";
  message: string;
} {
  if (plan.toAdd.length > 0) {
    const n = plan.toAdd.length;
    return {
      kind: "added",
      message: `Added ${n} item${n === 1 ? "" : "s"} to your list`,
    };
  }
  if (plan.skippedDuplicates.length > 0) {
    return { kind: "duplicates", message: "Already on your list" };
  }
  return { kind: "nothing", message: "You have everything!" };
}
