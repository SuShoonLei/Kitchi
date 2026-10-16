"use client";

import Link from "next/link";
import { useState } from "react";
import { Mascot } from "@/components/brand/mascot";
import { Badge, Button, Card } from "@/components/ui/sticker";
import { applyAlternative, draftsToSave, type ConfirmDraft } from "@/lib/scan/confirm";
import { getExpiryStatus } from "@/lib/expiry";
import { suggestIngredientNames } from "@/lib/recipes/vocabulary";
import { INGREDIENT_CATEGORIES, type IngredientCategory } from "@/lib/types";
import { useIngredientActions } from "@/lib/use-journal";
import type { IngredientInput } from "@/lib/api";

const TONE = { fresh: "green", soon: "yellow", urgent: "red" } as const;

export function ScanConfirm({
  drafts: initial,
  onCancel,
  onScanAnother,
}: {
  drafts: ConfirmDraft[];
  onCancel: () => void;
  onScanAnother: (current: ConfirmDraft[]) => void;
}) {
  const actions = useIngredientActions();
  const [drafts, setDrafts] = useState(initial);
  const [savedCount, setSavedCount] = useState<number | null>(null);

  function update(id: string, patch: Partial<ConfirmDraft>) {
    setDrafts((current) => current.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  }

  function addBlank() {
    setDrafts((current) => [
      ...current,
      {
        id: `draft-extra-${Date.now()}`,
        selected: true,
        name: "",
        quantity: 1,
        unit: "count",
        category: "produce" as IngredientCategory,
        expiresAt: new Date().toISOString().slice(0, 10),
        estimatedPrice: 0,
        unsure: false,
        alternatives: [],
      },
    ]);
  }

  async function save() {
    const ready = draftsToSave(drafts);
    for (const draft of ready) {
      const input: IngredientInput = {
        name: draft.name.trim(),
        quantity: draft.quantity,
        unit: draft.unit,
        category: draft.category,
        expiresAt: draft.expiresAt,
        estimatedPrice: draft.estimatedPrice,
      };
      await actions.create.mutateAsync(input);
    }
    setSavedCount(ready.length);
  }

  if (savedCount != null) {
    return (
      <Card className="mt-4 px-6 py-10 text-center">
        <Mascot mood="celebrating" size="lg" className="mx-auto" />
        <h2 className="mt-3 text-2xl">
          Added {savedCount} item{savedCount === 1 ? "" : "s"} to your pantry
        </h2>
        <Link className="sticker-press mt-5 inline-block bg-kitchi-orange px-4 py-2" href="/pantry">
          Open pantry
        </Link>
      </Card>
    );
  }

  const selectedCount = draftsToSave(drafts).length;

  return (
    <div className="mt-4 space-y-4">
      <h2 className="text-2xl text-kitchi-navy">Confirm before saving</h2>
      <p className="text-kitchi-navy/75">Nothing is saved until you tap the green button.</p>
      {drafts.map((draft) => (
        <Card key={draft.id} className="px-4 py-4 text-left">
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={draft.selected}
              aria-label={`Include ${draft.name || "item"}`}
              onChange={(event) => update(draft.id, { selected: event.target.checked })}
            />
            <div className="grid flex-1 gap-2">
              <label className="text-sm font-extrabold">
                Name
                <input
                  className="field"
                  list={`suggest-${draft.id}`}
                  value={draft.name}
                  onChange={(event) => update(draft.id, { name: event.target.value, unsure: false })}
                />
                <datalist id={`suggest-${draft.id}`}>
                  {suggestIngredientNames(draft.name, 8).map((name) => (
                    <option key={name} value={name} />
                  ))}
                </datalist>
              </label>
              {draft.unsure ? (
                <p className="text-sm font-extrabold text-kitchi-orange">Not sure — check the name.</p>
              ) : null}
              {draft.alternatives.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {draft.alternatives.map((alt) => (
                    <Button
                      key={alt}
                      variant="steam"
                      className="text-sm"
                      onClick={() => update(draft.id, applyAlternative(draft, alt))}
                    >
                      {alt}
                    </Button>
                  ))}
                </div>
              ) : null}
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <label className="text-sm font-extrabold">
                  Qty
                  <input
                    className="field"
                    type="number"
                    min={0}
                    step="any"
                    value={draft.quantity}
                    onChange={(event) => update(draft.id, { quantity: Number(event.target.value) })}
                  />
                </label>
                <label className="text-sm font-extrabold">
                  Unit
                  <input
                    className="field"
                    value={draft.unit}
                    onChange={(event) => update(draft.id, { unit: event.target.value })}
                  />
                </label>
                <label className="text-sm font-extrabold">
                  Category
                  <select
                    className="field"
                    value={draft.category}
                    onChange={(event) =>
                      update(draft.id, { category: event.target.value as IngredientCategory })
                    }
                  >
                    {INGREDIENT_CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm font-extrabold">
                  Expiry
                  <input
                    className="field"
                    type="date"
                    value={draft.expiresAt}
                    onChange={(event) => update(draft.id, { expiresAt: event.target.value })}
                  />
                </label>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={TONE[getExpiryStatus(draft.expiresAt)]}>
                  {getExpiryStatus(draft.expiresAt)}
                </Badge>
                <label className="text-sm font-extrabold">
                  Est. price
                  <input
                    className="field ml-2 w-24"
                    type="number"
                    min={0}
                    step="0.01"
                    value={draft.estimatedPrice}
                    onChange={(event) =>
                      update(draft.id, { estimatedPrice: Number(event.target.value) })
                    }
                  />
                </label>
                <Button
                  variant="navy"
                  className="ml-auto text-sm"
                  onClick={() => setDrafts((current) => current.filter((row) => row.id !== draft.id))}
                >
                  Delete
                </Button>
              </div>
              {draft.attribution ? (
                <p className="text-xs text-kitchi-navy/60">{draft.attribution}</p>
              ) : null}
            </div>
          </div>
        </Card>
      ))}
      <div className="flex flex-wrap gap-2">
        <Button variant="steam" onClick={addBlank}>
          Add missing item
        </Button>
        <Button variant="orange" onClick={() => onScanAnother(drafts)}>
          Scan another
        </Button>
        <Button disabled={selectedCount === 0 || actions.create.isPending} onClick={() => void save()}>
          {actions.create.isPending
            ? "Saving…"
            : `Add ${selectedCount} item${selectedCount === 1 ? "" : "s"} to pantry`}
        </Button>
        <Button variant="navy" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
