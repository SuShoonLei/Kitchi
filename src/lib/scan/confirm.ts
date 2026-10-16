import { CONFIDENCE_FLOOR, type RecognitionGuess } from "@/lib/scan/recognizer";
import { expiryFromShelfLife, guessCategoryFromName } from "@/lib/scan/shelf-life";
import type { IngredientCategory } from "@/lib/types";
import { findFoodLabel } from "@/lib/foodLabels";

export type ConfirmDraft = {
  id: string;
  selected: boolean;
  name: string;
  quantity: number;
  unit: string;
  category: IngredientCategory;
  expiresAt: string;
  estimatedPrice: number;
  unsure: boolean;
  alternatives: string[];
  barcode?: string;
  attribution?: string;
};

let draftSeq = 0;

export function createDraftId(): string {
  draftSeq += 1;
  return `draft-${draftSeq}-${Date.now()}`;
}

export function draftFromGuesses(
  guesses: RecognitionGuess[],
  unsure: boolean,
): ConfirmDraft {
  const top = guesses[0];
  const label = top?.label;
  const confidence = top?.confidence ?? 0;
  const low = unsure || confidence < CONFIDENCE_FLOOR;
  const name = label?.name ?? "";
  const category = label?.category ?? guessCategoryFromName(name || "other");
  return {
    id: createDraftId(),
    selected: Boolean(name) && !low,
    name,
    quantity: 1,
    unit: label?.unit ?? "count",
    category,
    expiresAt: expiryFromShelfLife(category),
    estimatedPrice: label?.roughPrice ?? 0,
    unsure: low,
    alternatives: guesses.slice(1).map((guess) => guess.label.name),
  };
}

export function draftFromBarcode(input: {
  name: string;
  barcode: string;
  quantityText?: string;
  attribution?: string;
}): ConfirmDraft {
  const category = guessCategoryFromName(input.name);
  const known = findFoodLabel(input.name);
  return {
    id: createDraftId(),
    selected: true,
    name: input.name,
    quantity: 1,
    unit: known?.unit ?? "count",
    category,
    expiresAt: expiryFromShelfLife(category),
    estimatedPrice: known?.roughPrice ?? 0,
    unsure: false,
    alternatives: [],
    barcode: input.barcode,
    attribution: input.attribution,
  };
}

export function applyAlternative(draft: ConfirmDraft, name: string): ConfirmDraft {
  const known = findFoodLabel(name);
  const category = known?.category ?? guessCategoryFromName(name);
  return {
    ...draft,
    name,
    unit: known?.unit ?? draft.unit,
    category,
    expiresAt: expiryFromShelfLife(category),
    estimatedPrice: known?.roughPrice ?? draft.estimatedPrice,
    selected: true,
    unsure: false,
  };
}

/** Confirm-step save rules for tests and UI. */
export function draftsToSave(drafts: ConfirmDraft[]): ConfirmDraft[] {
  return drafts.filter((draft) => draft.selected && draft.name.trim().length > 0);
}
