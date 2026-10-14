"use client";

import { useState, type ReactNode } from "react";
import { Mascot } from "@/components/brand/mascot";
import { Button } from "@/components/ui/sticker";
import type { IngredientInput } from "@/lib/api";
import { INGREDIENT_CATEGORIES, type IngredientCategory } from "@/lib/types";
import { useIngredientActions } from "@/lib/use-journal";
import { isApiError, toWireCategory } from "@/lib/wire";

const EMPTY = {
  name: "",
  quantity: "1",
  unit: "count",
  category: "produce" as IngredientCategory,
  expiresAt: "",
  estimatedPrice: "",
};

export function ManualForm() {
  const actions = useIngredientActions();
  const [values, setValues] = useState(EMPTY);
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);
  const fieldErrors = {
    ...localErrors,
    ...(isApiError(actions.create.error) ? actions.create.error.fieldErrors : {}),
  };

  function set<K extends keyof typeof EMPTY>(key: K, value: (typeof EMPTY)[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function validate(): IngredientInput | null {
    const errors: Record<string, string> = {};
    const name = values.name.trim();
    if (!name || name.length > 120 || /[\u0000-\u001F]/.test(name)) errors.name = "Give it a name, up to 120 characters.";
    const quantity = Number(values.quantity);
    if (!Number.isFinite(quantity) || quantity <= 0) errors.quantity = "Quantity has to be more than zero.";
    const unit = values.unit.trim();
    if (!unit || unit.length > 32) errors.unit = "Add a unit, up to 32 characters.";
    if (!values.expiresAt) errors.expiresAt = "Pick an expiry date.";
    const estimatedPrice = Number(values.estimatedPrice);
    if (!Number.isFinite(estimatedPrice) || estimatedPrice < 0) errors.estimatedPrice = "Price has to be zero or more.";
    else if (!/^\d+(\.\d{1,2})?$/.test(values.estimatedPrice)) errors.estimatedPrice = "Use at most 2 decimal places.";
    try {
      toWireCategory(values.category);
    } catch {
      errors.category = "Pick a category.";
    }
    setLocalErrors(errors);
    if (Object.keys(errors).length > 0) return null;
    return {
      name,
      quantity,
      unit,
      category: values.category,
      expiresAt: values.expiresAt,
      estimatedPrice,
    };
  }

  return (
    <form
      className="mx-auto mt-4 grid max-w-xl gap-3 text-left"
      onSubmit={(event) => {
        event.preventDefault();
        const input = validate();
        if (!input) return;
        setSaved(false);
        actions.create.mutate(input, {
          onSuccess: () => {
            setValues(EMPTY);
            setSaved(true);
          },
        });
      }}
    >
      <Field label="Name" error={fieldErrors.name}>
        <input className="field" value={values.name} onChange={(event) => set("name", event.target.value)} />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Quantity" error={fieldErrors.quantity}>
          <input className="field" inputMode="decimal" value={values.quantity} onChange={(event) => set("quantity", event.target.value)} />
        </Field>
        <Field label="Unit" error={fieldErrors.unit}>
          <input className="field" value={values.unit} onChange={(event) => set("unit", event.target.value)} />
        </Field>
      </div>
      <Field label="Category" error={fieldErrors.category}>
        <select className="field" value={values.category} onChange={(event) => set("category", event.target.value as IngredientCategory)}>
          {INGREDIENT_CATEGORIES.map((category) => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Expiry date" error={fieldErrors.expiresAt}>
          <input className="field" type="date" value={values.expiresAt} onChange={(event) => set("expiresAt", event.target.value)} />
        </Field>
        <Field label="Estimated price" error={fieldErrors.estimatedPrice}>
          <input className="field" inputMode="decimal" value={values.estimatedPrice} onChange={(event) => set("estimatedPrice", event.target.value)} />
        </Field>
      </div>
      {actions.create.error && !isApiError(actions.create.error) ? (
        <p className="text-sm font-bold text-kitchi-red">{actions.create.error.message}</p>
      ) : null}
      <Button type="submit" disabled={actions.create.isPending}>
        {actions.create.isPending ? "Saving…" : "Add to pantry"}
      </Button>
      {saved ? (
        <div className="flex items-center gap-3" role="status">
          <Mascot mood="celebrating" size="sm" />
          <p className="font-extrabold text-kitchi-navy">It is on the shelf.</p>
        </div>
      ) : null}
    </form>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <label className="text-sm font-extrabold text-kitchi-navy">
      {label}
      {children}
      {error ? <span className="mt-1 block font-bold text-kitchi-red">{error}</span> : null}
    </label>
  );
}
