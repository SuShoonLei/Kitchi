"use client";

import Link from "next/link";
import { useMemo, useState, type MouseEvent } from "react";
import { Mascot } from "@/components/brand/mascot";
import { Button, Card } from "@/components/ui/sticker";
import { formatMoney } from "@/lib/format";
import {
  describeMissingGroceryPlan,
  planMissingGroceryAdds,
} from "@/lib/grocery/missing-items";
import type { RankedRecipe } from "@/lib/recipes/rank";
import { useGroceryActions, useIngredientActions, useSettings } from "@/lib/use-journal";
import { useFridgeStore } from "@/store/use-fridge-store";

type GroceryToast = {
  kind: "added" | "duplicates" | "nothing" | "error";
  message: string;
};

export function RecipeDetail({
  recipe,
  onClose,
}: {
  recipe: RankedRecipe;
  onClose: () => void;
}) {
  const grocery = useGroceryActions();
  const ingredients = useIngredientActions();
  const settings = useSettings();
  const addMeal = useFridgeStore((state) => state.addMeal);
  const groceryList = useFridgeStore((state) => state.groceryList);
  const [toast, setToast] = useState<GroceryToast | null>(null);
  const [savingGrocery, setSavingGrocery] = useState(false);
  const [cooking, setCooking] = useState(false);
  const [savedAmount, setSavedAmount] = useState<number | null>(null);
  const [cookQty, setCookQty] = useState<Record<string, number>>(() => {
    const next: Record<string, number> = {};
    for (const row of recipe.haveIngredients) {
      if (!row.pantry) continue;
      next[row.pantry.id] = Math.min(row.pantry.quantity, row.recipe.quantity || 1);
    }
    return next;
  });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () => new Set(recipe.haveIngredients.map((row) => row.pantry?.id).filter(Boolean) as string[]),
  );

  const currency = settings.data?.currency ?? "USD";
  const plan = useMemo(
    () => planMissingGroceryAdds(recipe.missingIngredients, groceryList, recipe.name),
    [groceryList, recipe.missingIngredients, recipe.name],
  );
  const nothingMissing = plan.toAdd.length === 0 && plan.skippedDuplicates.length === 0;

  async function addMissing(event: MouseEvent) {
    event.stopPropagation();
    event.preventDefault();
    const nextPlan = planMissingGroceryAdds(recipe.missingIngredients, groceryList, recipe.name);
    if (nextPlan.toAdd.length === 0) {
      setToast(describeMissingGroceryPlan(nextPlan));
      return;
    }

    setSavingGrocery(true);
    setToast(null);
    try {
      for (const item of nextPlan.toAdd) {
        await grocery.create.mutateAsync(item);
      }
      setToast(describeMissingGroceryPlan(nextPlan));
    } catch {
      setToast({ kind: "error", message: "Couldn't update your grocery list. Try again." });
    } finally {
      setSavingGrocery(false);
    }
  }

  function confirmCook() {
    const used = recipe.haveIngredients.filter(
      (row) => row.pantry && selectedIds.has(row.pantry.id),
    );
    let saved = 0;
    for (const row of used) {
      if (!row.pantry) continue;
      saved +=
        row.pantry.estimatedPrice *
        Math.min(1, (cookQty[row.pantry.id] ?? 0) / (row.pantry.quantity || 1));
      ingredients.used.mutate(row.pantry);
    }
    addMeal({
      name: recipe.name,
      cuisine: recipe.cuisine,
      moneySaved: Math.round(saved * 100) / 100,
      ingredientsUsed: used.map((row) => ({
        name: row.pantry?.name ?? row.recipe.name,
        quantity: row.pantry ? cookQty[row.pantry.id] ?? row.recipe.quantity : row.recipe.quantity,
        unit: row.pantry?.unit ?? row.recipe.unit,
      })),
    });
    setSavedAmount(Math.round(saved * 100) / 100);
    setCooking(false);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-kitchi-navy/40 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="recipe-detail-title"
      onClick={onClose}
    >
      <Card className="max-h-[90vh] w-full max-w-lg overflow-y-auto px-5 py-6">
        <div
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => {
            if (event.key === "Escape") onClose();
          }}
        >
          {savedAmount != null ? (
            <div className="text-center">
              <Mascot mood="celebrating" size="lg" className="mx-auto" />
              <h2 id="recipe-detail-title" className="mt-3 text-2xl">
                You cooked {recipe.name}!
              </h2>
              <p className="mt-2 font-extrabold text-kitchi-green">
                About {formatMoney(savedAmount, currency)} rescued from the fridge.
              </p>
              <Button className="mt-5" onClick={onClose}>
                Back to ideas
              </Button>
            </div>
          ) : cooking ? (
            <div>
              <h2 id="recipe-detail-title" className="text-2xl">
                What did you use?
              </h2>
              <p className="mt-2 text-kitchi-navy/75">
                Uncheck anything you kept, and tweak quantities if needed.
              </p>
              <ul className="mt-4 space-y-3">
                {recipe.haveIngredients
                  .filter((row) => row.pantry)
                  .map((row) => {
                    const item = row.pantry!;
                    const checked = selectedIds.has(item.id);
                    return (
                      <li key={item.id} className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() =>
                            setSelectedIds((current) => {
                              const next = new Set(current);
                              if (next.has(item.id)) next.delete(item.id);
                              else next.add(item.id);
                              return next;
                            })
                          }
                        />
                        <span className="flex-1 font-bold">{item.name}</span>
                        <input
                          className="field w-20"
                          type="number"
                          min={0}
                          step="any"
                          disabled={!checked}
                          value={cookQty[item.id] ?? 0}
                          onChange={(event) =>
                            setCookQty((current) => ({
                              ...current,
                              [item.id]: Number(event.target.value),
                            }))
                          }
                        />
                        <span className="text-sm">{item.unit}</span>
                      </li>
                    );
                  })}
              </ul>
              <div className="mt-5 flex flex-wrap gap-2">
                <Button onClick={confirmCook}>Mark as cooked</Button>
                <Button variant="steam" onClick={() => setCooking(false)}>
                  Back
                </Button>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-extrabold text-kitchi-orange">{recipe.cuisine}</p>
                  <h2 id="recipe-detail-title" className="text-3xl text-kitchi-navy">
                    {recipe.name}
                  </h2>
                  <p className="mt-1 text-kitchi-navy/75">
                    {recipe.timeMinutes} min · serves {recipe.servings} · {recipe.difficulty}
                  </p>
                </div>
                <Button variant="steam" onClick={onClose} aria-label="Close">
                  Close
                </Button>
              </div>
              <p className="mt-3">{recipe.description}</p>

              <h3 className="mt-6 text-xl">Ingredients</h3>
              <ul className="mt-2 space-y-1">
                {recipe.ingredients.map((line) => {
                  const have = recipe.haveIngredients.some(
                    (row) => row.recipe.name === line.name && row.coverage > 0,
                  );
                  const missing = recipe.missingIngredients.some((row) => row.name === line.name);
                  return (
                    <li key={`${line.name}-${line.unit}`} className="flex gap-2 text-sm font-bold">
                      <span aria-hidden>{have ? "✓" : missing ? "○" : "·"}</span>
                      <span>
                        {line.quantity} {line.unit} {line.name}
                        {line.optional ? " (optional)" : ""}
                        {line.staple ? " (staple)" : ""}
                      </span>
                    </li>
                  );
                })}
              </ul>

              <h3 className="mt-6 text-xl">Steps</h3>
              <ol className="mt-2 list-decimal space-y-2 pl-5">
                {recipe.steps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>

              <div className="mt-6 flex flex-wrap gap-2">
                {nothingMissing ? (
                  <p className="w-full text-sm font-extrabold text-kitchi-green" data-testid="have-everything">
                    You have everything!
                  </p>
                ) : (
                  <Button
                    variant="orange"
                    data-testid="add-missing-grocery"
                    disabled={savingGrocery || grocery.create.isPending}
                    onClick={(event) => void addMissing(event)}
                  >
                    {savingGrocery || grocery.create.isPending
                      ? "Adding…"
                      : plan.toAdd.length === 0
                        ? "Already on your list"
                        : "Add missing to grocery list"}
                  </Button>
                )}
                <Button onClick={() => setCooking(true)}>I cooked this</Button>
              </div>
              {toast ? (
                <div
                  className={`mt-3 text-sm font-extrabold ${
                    toast.kind === "error" ? "text-kitchi-red" : "text-kitchi-green"
                  }`}
                  role="status"
                  data-testid="grocery-toast"
                >
                  <p>{toast.message}</p>
                  {toast.kind === "added" ? (
                    <Link
                      href="/grocery"
                      className="mt-1 inline-block underline"
                      onClick={(event) => event.stopPropagation()}
                    >
                      View list
                    </Link>
                  ) : null}
                </div>
              ) : null}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
