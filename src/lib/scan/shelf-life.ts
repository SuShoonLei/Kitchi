import { addDays, formatISO } from "date-fns";
import type { IngredientCategory } from "@/lib/types";

/** Suggested fridge shelf life in days by category. */
export const SHELF_LIFE_DAYS: Record<IngredientCategory, number> = {
  produce: 5,
  dairy: 7,
  protein: 3,
  grain: 90,
  pantry: 180,
  frozen: 90,
  other: 14,
};

export function expiryFromShelfLife(
  category: IngredientCategory,
  from: Date = new Date(),
): string {
  return formatISO(addDays(from, SHELF_LIFE_DAYS[category]), { representation: "date" });
}

export function guessCategoryFromName(name: string): IngredientCategory {
  const lower = name.toLowerCase();
  if (/(milk|yogurt|cheese|butter|cream)/.test(lower)) return "dairy";
  if (/(chicken|beef|pork|fish|shrimp|tofu|egg|bacon|salmon)/.test(lower)) return "protein";
  if (/(rice|pasta|noodle|bread|oat|flour|quinoa)/.test(lower)) return "grain";
  if (/(frozen)/.test(lower)) return "frozen";
  if (/(oil|sauce|salt|sugar|spice|vinegar|broth|bean|lentil)/.test(lower)) return "pantry";
  if (/(tomato|onion|spinach|lettuce|pepper|cabbage|herb|fruit|berry)/.test(lower)) {
    return "produce";
  }
  return "produce";
}
