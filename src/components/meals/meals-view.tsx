"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Mascot } from "@/components/brand/mascot";
import { RecipeDetail } from "@/components/meals/recipe-detail";
import { PageFrame, PageHeader } from "@/components/ui/page-header";
import { QueryGate } from "@/components/ui/query-state";
import { Badge, Button, Card, Chip } from "@/components/ui/sticker";
import { getExpiryStatus } from "@/lib/expiry";
import { listRecipes } from "@/lib/recipes";
import { rankRecipes, type RankedRecipe } from "@/lib/recipes/rank";
import { useLoadSampleData } from "@/lib/sample-data";
import { CUISINES, type Cuisine } from "@/lib/types";
import { useIngredients, useSettings } from "@/lib/use-journal";

type CuisineFilter = "all" | "mine" | Cuisine;
type StockFilter = "have" | "almost";

const EXPIRY_TONE = { fresh: "green", soon: "yellow", urgent: "red" } as const;

export function MealsView() {
  const pantry = useIngredients();
  const settings = useSettings();
  const loadSample = useLoadSampleData();
  const [cuisineFilter, setCuisineFilter] = useState<CuisineFilter>("all");
  const [vegetarian, setVegetarian] = useState(false);
  const [quick, setQuick] = useState(false);
  const [stock, setStock] = useState<StockFilter>("almost");
  const [selected, setSelected] = useState<RankedRecipe | null>(null);

  const preferred = useMemo(
    () => settings.data?.preferredCuisines ?? [],
    [settings.data?.preferredCuisines],
  );
  const recipes = useMemo(() => listRecipes(), []);
  const ranked = useMemo(() => {
    const items = pantry.data ?? [];
    return rankRecipes(items, recipes, { preferredCuisines: preferred });
  }, [pantry.data, preferred, recipes]);

  const filtered = useMemo(() => {
    return ranked.filter((recipe) => {
      if (cuisineFilter === "mine" && !preferred.includes(recipe.cuisine)) return false;
      if (cuisineFilter !== "all" && cuisineFilter !== "mine" && recipe.cuisine !== cuisineFilter) {
        return false;
      }
      if (vegetarian && !recipe.tags.includes("vegetarian")) return false;
      if (quick && recipe.timeMinutes > 30) return false;
      const missing = recipe.missingIngredients.length;
      if (stock === "have" && missing > 0) return false;
      if (stock === "almost" && missing > 2) return false;
      return true;
    });
  }, [cuisineFilter, preferred, quick, ranked, stock, vegetarian]);

  const useFirst = filtered.filter((recipe) => recipe.usesExpiring.length > 0);
  const useFirstIds = new Set(useFirst.map((recipe) => recipe.id));
  const makeNow = filtered.filter(
    (recipe) =>
      recipe.matchPercent >= 0.999 &&
      recipe.usesExpiring.length === 0 &&
      !useFirstIds.has(recipe.id),
  );
  const makeNowIds = new Set(makeNow.map((recipe) => recipe.id));
  const almost = filtered.filter(
    (recipe) =>
      recipe.missingIngredients.length >= 1 &&
      recipe.missingIngredients.length <= 2 &&
      recipe.matchPercent < 0.999 &&
      !useFirstIds.has(recipe.id) &&
      !makeNowIds.has(recipe.id),
  );

  const expiringIdeaCount = useFirst.length;
  const emptyPantry = (pantry.data ?? []).length === 0;

  return (
    <PageFrame>
      <PageHeader
        eyebrow="From the fridge"
        title="Meal ideas"
        description="Let's cook something tasty from what you already have, starting with whatever needs love first."
      />
      <QueryGate isLoading={pantry.isLoading} error={pantry.error} onRetry={() => void pantry.refetch()}>
        <div className="mt-6 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <Mascot mood="cooking" size="md" />
          <p className="text-lg font-extrabold text-kitchi-navy" role="status">
            {emptyPantry
              ? "Add a few ingredients and ideas will bubble up."
              : expiringIdeaCount > 0
                ? `${expiringIdeaCount} idea${expiringIdeaCount === 1 ? "" : "s"} use food that's about to expire.`
                : "Nothing urgent — here are solid matches from your shelf."}
          </p>
        </div>

        {emptyPantry ? (
          <Card className="mt-8 px-6 py-10 text-center">
            <Mascot mood="sleepy" size="lg" className="mx-auto" />
            <h2 className="mt-3 text-2xl text-kitchi-navy">The pantry&apos;s empty</h2>
            <p className="mx-auto mt-2 max-w-md text-kitchi-navy/75">
              Add what you have, or load sample data to peek at meal ideas right away.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <Link className="sticker-press bg-kitchi-red px-4 py-2 text-kitchi-cream" href="/add">
                Add ingredients
              </Link>
              <Button variant="steam" onClick={() => loadSample()}>
                Load sample data
              </Button>
            </div>
          </Card>
        ) : (
          <>
            <div className="mt-6 flex flex-wrap gap-2" role="group" aria-label="Cuisine filters">
              <Chip pressed={cuisineFilter === "all"} onClick={() => setCuisineFilter("all")}>
                All
              </Chip>
              <Chip pressed={cuisineFilter === "mine"} onClick={() => setCuisineFilter("mine")}>
                My cuisines
              </Chip>
              {CUISINES.map((cuisine) => (
                <Chip
                  key={cuisine}
                  pressed={cuisineFilter === cuisine}
                  onClick={() => setCuisineFilter(cuisine)}
                >
                  {cuisine}
                </Chip>
              ))}
              <Chip pressed={vegetarian} onClick={() => setVegetarian((value) => !value)}>
                Vegetarian
              </Chip>
              <Chip pressed={quick} onClick={() => setQuick((value) => !value)}>
                Quick
              </Chip>
            </div>
            <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Stock filters">
              <Chip pressed={stock === "have"} onClick={() => setStock("have")}>
                Only what I have
              </Chip>
              <Chip pressed={stock === "almost"} onClick={() => setStock("almost")}>
                Missing up to 2 items
              </Chip>
            </div>

            {filtered.length === 0 ? (
              <Card className="mt-8 px-6 py-10 text-center">
                <Mascot mood="worried" size="lg" className="mx-auto" />
                <h2 className="mt-3 text-2xl">No matches with these filters</h2>
                <p className="mx-auto mt-2 max-w-md text-kitchi-navy/75">
                  Try relaxing the filters, adding a few pantry items, or loading sample data.
                </p>
                <div className="mt-5 flex flex-wrap justify-center gap-2">
                  <Button
                    variant="steam"
                    onClick={() => {
                      setCuisineFilter("all");
                      setVegetarian(false);
                      setQuick(false);
                      setStock("almost");
                    }}
                  >
                    Reset filters
                  </Button>
                  <Button variant="orange" onClick={() => loadSample()}>
                    Load sample data
                  </Button>
                </div>
              </Card>
            ) : (
              <div className="mt-8 space-y-10">
                <RecipeSection
                  title="Use these up first"
                  recipes={useFirst}
                  onOpen={setSelected}
                />
                <RecipeSection
                  title="You can make these now"
                  recipes={makeNow}
                  onOpen={setSelected}
                />
                <RecipeSection title="Almost there" recipes={almost} onOpen={setSelected} />
              </div>
            )}
          </>
        )}
      </QueryGate>

      {selected ? <RecipeDetail recipe={selected} onClose={() => setSelected(null)} /> : null}
    </PageFrame>
  );
}

function RecipeSection({
  title,
  recipes,
  onOpen,
}: {
  title: string;
  recipes: RankedRecipe[];
  onOpen: (recipe: RankedRecipe) => void;
}) {
  if (recipes.length === 0) return null;
  return (
    <section aria-labelledby={`section-${title}`}>
      <h2 id={`section-${title}`} className="text-2xl text-kitchi-navy">
        {title}
      </h2>
      <ul className="mt-4 grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2">
        {recipes.map((recipe) => (
          <li key={recipe.id}>
            <button
              type="button"
              className="sticker-card w-full px-4 py-4 text-left transition hover:-translate-y-0.5"
              onClick={() => onOpen(recipe)}
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-xl text-kitchi-navy">{recipe.name}</h3>
                <Badge tone="quiet">{recipe.cuisine}</Badge>
              </div>
              <p className="mt-1 text-sm font-bold text-kitchi-navy/70">
                {recipe.timeMinutes} min · {Math.round(recipe.matchPercent * 100)}% match
              </p>
              <div
                className="mt-2 h-2 overflow-hidden rounded-full bg-kitchi-steam"
                aria-hidden
              >
                <div
                  className="h-full rounded-full bg-kitchi-green"
                  style={{ width: `${Math.round(recipe.matchPercent * 100)}%` }}
                />
              </div>
              {recipe.usesExpiring.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-1">
                  {recipe.usesExpiring.slice(0, 4).map((item) => (
                    <Badge key={item.id} tone={EXPIRY_TONE[getExpiryStatus(item.expiresAt)]}>
                      {item.name}
                    </Badge>
                  ))}
                </div>
              ) : null}
              {recipe.missingIngredients.length > 0 ? (
                <p className="mt-3 text-sm font-bold text-kitchi-navy/80">
                  Missing:{" "}
                  {recipe.missingIngredients.map((line) => line.name).join(", ")}
                </p>
              ) : null}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
