import { describe, expect, it } from "vitest";
import { FOOD_LABELS } from "@/lib/foodLabels";
import {
  applyAlternative,
  draftFromGuesses,
  draftsToSave,
} from "@/lib/scan/confirm";

describe("confirm-step rules", () => {
  it("leaves low-confidence guesses unselected", () => {
    const draft = draftFromGuesses(
      [
        { label: FOOD_LABELS[0], confidence: 0.32 },
        { label: FOOD_LABELS[1], confidence: 0.2 },
      ],
      true,
    );
    expect(draft.selected).toBe(false);
    expect(draft.unsure).toBe(true);
  });

  it("selects confident guesses", () => {
    const draft = draftFromGuesses(
      [{ label: FOOD_LABELS[0], confidence: 0.82 }],
      false,
    );
    expect(draft.selected).toBe(true);
  });

  it("cancel saves nothing (empty selection list)", () => {
    const drafts = [
      draftFromGuesses([{ label: FOOD_LABELS[0], confidence: 0.9 }], false),
    ];
    expect(draftsToSave([])).toEqual([]);
    expect(draftsToSave(drafts.map((d) => ({ ...d, selected: false }))).length).toBe(0);
  });

  it("saves N selected items", () => {
    const a = draftFromGuesses([{ label: FOOD_LABELS[0], confidence: 0.9 }], false);
    const b = draftFromGuesses([{ label: FOOD_LABELS[1], confidence: 0.9 }], false);
    expect(draftsToSave([a, b])).toHaveLength(2);
  });

  it("swaps alternative guesses into the draft", () => {
    const draft = draftFromGuesses(
      [
        { label: FOOD_LABELS[0], confidence: 0.4 },
        { label: FOOD_LABELS[2], confidence: 0.3 },
      ],
      true,
    );
    const next = applyAlternative(draft, FOOD_LABELS[2].name);
    expect(next.name).toBe(FOOD_LABELS[2].name);
    expect(next.selected).toBe(true);
  });
});
