import { describe, expect, it } from "vitest";
import {
  describeMissingGroceryPlan,
  groceryAlreadyHas,
  planMissingGroceryAdds,
} from "@/lib/grocery/missing-items";
import type { RecipeIngredient } from "@/lib/recipes/types";

function line(
  name: string,
  partial: Partial<RecipeIngredient> = {},
): RecipeIngredient {
  return {
    name,
    quantity: 1,
    unit: "count",
    optional: false,
    staple: false,
    ...partial,
  };
}

describe("planMissingGroceryAdds", () => {
  it("skips staples and optional lines", () => {
    const plan = planMissingGroceryAdds(
      [
        line("Salt", { staple: true }),
        line("Cheddar", { optional: true }),
        line("Baby spinach", { quantity: 2, unit: "cup" }),
      ],
      [],
      "Omelette",
    );
    expect(plan.toAdd).toEqual([
      {
        name: "Baby spinach",
        quantity: 2,
        unit: "cup",
        estimatedPrice: 0,
        reason: "For Omelette",
      },
    ]);
    expect(plan.skippedStaples).toContain("Salt");
    expect(plan.skippedOptional).toContain("Cheddar");
  });

  it("skips staples detected by vocabulary even without the flag", () => {
    const plan = planMissingGroceryAdds([line("Cooking oil")], [], "Noodles");
    expect(plan.toAdd).toEqual([]);
    expect(plan.skippedStaples).toContain("Cooking oil");
  });

  it("treats synonyms as duplicates on the grocery list", () => {
    expect(groceryAlreadyHas([{ name: "Cilantro", checked: false }], "coriander")).toBe(true);
    expect(groceryAlreadyHas([{ name: "Cilantro", checked: true }], "coriander")).toBe(false);

    const plan = planMissingGroceryAdds(
      [line("coriander"), line("Basil")],
      [{ name: "Cilantro", checked: false }],
      "Salad",
    );
    expect(plan.skippedDuplicates).toContain("coriander");
    expect(plan.toAdd.map((row) => row.name)).toEqual(["Basil"]);
  });

  it("does not enqueue the same canonical name twice", () => {
    const plan = planMissingGroceryAdds(
      [line("Green onion"), line("scallion")],
      [],
      "Noodles",
    );
    expect(plan.toAdd).toHaveLength(1);
    expect(plan.toAdd[0]?.name).toBe("Green onion");
    expect(plan.skippedDuplicates).toContain("scallion");
  });

  it("describes outcomes for the toast", () => {
    expect(describeMissingGroceryPlan({ toAdd: [{ name: "A", quantity: 1, unit: "count", estimatedPrice: 0, reason: "For X" }], skippedDuplicates: [], skippedStaples: [], skippedOptional: [] }).message).toMatch(/Added 1 item/);
    expect(
      describeMissingGroceryPlan({
        toAdd: [],
        skippedDuplicates: ["Basil"],
        skippedStaples: [],
        skippedOptional: [],
      }).kind,
    ).toBe("duplicates");
    expect(
      describeMissingGroceryPlan({
        toAdd: [],
        skippedDuplicates: [],
        skippedStaples: [],
        skippedOptional: [],
      }).message,
    ).toBe("You have everything!");
  });
});
