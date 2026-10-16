#!/usr/bin/env node
/**
 * Validates frontend/data/recipes.json against frontend/data/vocabulary.json.
 * Exit 0 on success; prints errors and exits 1 on failure.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const CUISINES = new Set([
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
]);
const DIFFICULTIES = new Set(["easy", "medium", "hard"]);

function loadJson(relativePath) {
  return JSON.parse(readFileSync(join(root, relativePath), "utf8"));
}

function fail(errors) {
  for (const error of errors) console.error(`✗ ${error}`);
  console.error(`\n${errors.length} validation error(s).`);
  process.exit(1);
}

const vocabulary = loadJson("frontend/data/vocabulary.json");
const recipesFile = loadJson("frontend/data/recipes.json");
const errors = [];

if (!Array.isArray(vocabulary.items) || vocabulary.items.length === 0) {
  errors.push("vocabulary.items must be a non-empty array");
}
if (!Array.isArray(vocabulary.staples)) {
  errors.push("vocabulary.staples must be an array");
}
if (!vocabulary.synonyms || typeof vocabulary.synonyms !== "object") {
  errors.push("vocabulary.synonyms must be an object");
}

const canonical = new Set(vocabulary.items ?? []);
const staples = new Set((vocabulary.staples ?? []).map((name) => String(name)));

if (canonical.size !== (vocabulary.items?.length ?? 0)) {
  errors.push("vocabulary.items contains duplicate names");
}

for (const staple of staples) {
  if (!canonical.has(staple)) {
    errors.push(`staple "${staple}" is not listed in vocabulary.items`);
  }
}

for (const [alias, target] of Object.entries(vocabulary.synonyms ?? {})) {
  if (!alias.trim()) errors.push("synonym key is empty");
  if (!canonical.has(target)) {
    errors.push(`synonym "${alias}" points to unknown canonical "${target}"`);
  }
}

const recipes = recipesFile.recipes;
if (!Array.isArray(recipes) || recipes.length === 0) {
  fail(["recipes.json must contain a non-empty recipes array"]);
}

const ids = new Set();
const cuisineCounts = Object.fromEntries([...CUISINES].map((c) => [c, 0]));

for (const [index, recipe] of recipes.entries()) {
  const label = recipe?.id ? `recipe ${recipe.id}` : `recipe[${index}]`;

  if (!recipe || typeof recipe !== "object") {
    errors.push(`${label}: must be an object`);
    continue;
  }
  if (typeof recipe.id !== "string" || !recipe.id.trim()) {
    errors.push(`${label}: id is required`);
  } else if (ids.has(recipe.id)) {
    errors.push(`${label}: duplicate id`);
  } else {
    ids.add(recipe.id);
  }

  if (typeof recipe.name !== "string" || !recipe.name.trim()) {
    errors.push(`${label}: name is required`);
  }
  if (!CUISINES.has(recipe.cuisine)) {
    errors.push(`${label}: invalid cuisine "${recipe.cuisine}"`);
  } else {
    cuisineCounts[recipe.cuisine] += 1;
  }
  if (typeof recipe.description !== "string" || !recipe.description.trim()) {
    errors.push(`${label}: description is required`);
  }
  if (!Number.isFinite(recipe.timeMinutes) || recipe.timeMinutes <= 0) {
    errors.push(`${label}: timeMinutes must be a positive number`);
  }
  if (!Number.isFinite(recipe.servings) || recipe.servings <= 0) {
    errors.push(`${label}: servings must be a positive number`);
  }
  if (!DIFFICULTIES.has(recipe.difficulty)) {
    errors.push(`${label}: difficulty must be easy|medium|hard`);
  }
  if (!Array.isArray(recipe.tags)) {
    errors.push(`${label}: tags must be an array`);
  }
  if (!Array.isArray(recipe.ingredients) || recipe.ingredients.length === 0) {
    errors.push(`${label}: ingredients must be a non-empty array`);
  } else {
    for (const [i, ingredient] of recipe.ingredients.entries()) {
      const ilabel = `${label} ingredient[${i}]`;
      if (typeof ingredient.name !== "string" || !ingredient.name.trim()) {
        errors.push(`${ilabel}: name is required`);
        continue;
      }
      if (!canonical.has(ingredient.name)) {
        errors.push(`${ilabel}: "${ingredient.name}" is not in the vocabulary`);
      }
      if (!Number.isFinite(ingredient.quantity) || ingredient.quantity < 0) {
        errors.push(`${ilabel}: quantity must be a number ≥ 0`);
      }
      if (typeof ingredient.unit !== "string" || !ingredient.unit.trim()) {
        errors.push(`${ilabel}: unit is required`);
      }
      if (typeof ingredient.optional !== "boolean") {
        errors.push(`${ilabel}: optional must be boolean`);
      }
      if (typeof ingredient.staple !== "boolean") {
        errors.push(`${ilabel}: staple must be boolean`);
      }
      if (ingredient.staple && !staples.has(ingredient.name)) {
        errors.push(
          `${ilabel}: marked staple but "${ingredient.name}" is not in vocabulary.staples`,
        );
      }
      if (!ingredient.staple && staples.has(ingredient.name)) {
        errors.push(
          `${ilabel}: "${ingredient.name}" is a listed staple but staple flag is false`,
        );
      }
    }
  }

  if (!Array.isArray(recipe.steps)) {
    errors.push(`${label}: steps must be an array`);
  } else {
    if (recipe.steps.length < 4 || recipe.steps.length > 7) {
      errors.push(`${label}: steps must have 4–7 entries (got ${recipe.steps.length})`);
    }
    for (const [i, step] of recipe.steps.entries()) {
      if (typeof step !== "string" || !step.trim()) {
        errors.push(`${label}: step[${i}] is empty`);
      }
    }
  }
}

if (recipes.length < 50) {
  errors.push(`expected about 60 recipes, found only ${recipes.length}`);
}

for (const [cuisine, count] of Object.entries(cuisineCounts)) {
  if (count < 4) {
    errors.push(`cuisine ${cuisine} has only ${count} recipe(s); need at least 4`);
  }
}

if (errors.length > 0) fail(errors);

console.log(`✓ vocabulary: ${canonical.size} items, ${staples.size} staples, ${Object.keys(vocabulary.synonyms).length} synonyms`);
console.log(`✓ recipes: ${recipes.length} dishes across ${CUISINES.size} cuisines`);
for (const cuisine of CUISINES) {
  console.log(`  · ${cuisine}: ${cuisineCounts[cuisine]}`);
}
console.log("✓ all ingredient names are in the vocabulary");
console.log("✓ validation passed");
