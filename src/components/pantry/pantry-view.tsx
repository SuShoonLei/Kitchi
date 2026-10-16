"use client";

import { useState } from "react";
import { Mascot } from "@/components/brand/mascot";
import { EmptyState } from "@/components/ui/empty-state";
import { PageFrame, PageHeader } from "@/components/ui/page-header";
import { QueryGate } from "@/components/ui/query-state";
import { Badge, Button, Card } from "@/components/ui/sticker";
import { unreachableMessage } from "@/lib/wire";
import { formatExpiryLabel, getExpiryStatus } from "@/lib/expiry";
import { formatMoney } from "@/lib/format";
import { INGREDIENT_CATEGORIES, type Ingredient, type IngredientCategory } from "@/lib/types";
import { useLoadSampleData } from "@/lib/sample-data";
import { useIngredientActions, useIngredients, useSettings } from "@/lib/use-journal";
const TONE = { fresh: "green", soon: "yellow", urgent: "red" } as const;

export function PantryView() {
  const list = useIngredients();
  const settings = useSettings();
  const actions = useIngredientActions();
  const loadSample = useLoadSampleData();
  const [editing, setEditing] = useState<Ingredient | null>(null);
  const [toast, setToast] = useState<{ text: string; undo?: () => void; celebrate?: boolean } | null>(null);
  const currency = settings.data?.currency ?? "USD";

  function celebrate(text: string) {
    setToast({ text, celebrate: true });
  }

  return (
    <PageFrame>
      <PageHeader
        eyebrow="On the shelf"
        title="Pantry"
        description="Everything you bought gets a spot here, with the loudest expiry dates first."
      />
      <QueryGate isLoading={list.isLoading} error={list.error} onRetry={() => void list.refetch()}>
        {(list.data ?? []).length === 0 ? (
          <div>
            <EmptyState
              title="The pantry's having a nap"
              mood="sleepy"
              description="Add some food and it'll line up here with green, yellow, and red stickers."
            />
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <a className="sticker-press bg-kitchi-red px-4 py-2 text-kitchi-cream" href="/add">
                Add ingredients
              </a>
              <Button variant="steam" onClick={() => loadSample()}>
                Load sample data
              </Button>
            </div>
          </div>
        ) : (
          <ul className="mt-6 grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2">
            {(list.data ?? []).map((item) => {
              const status = getExpiryStatus(item.expiresAt);
              return (
                <li key={item.id}>
                  <Card className="px-4 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="text-xl text-kitchi-navy">{item.name}</h2>
                        <p className="text-sm font-bold text-kitchi-navy/70">
                          {item.quantity} {item.unit} · {formatMoney(item.estimatedPrice, currency)}
                        </p>
                      </div>
                      <Badge tone={TONE[status]}>{formatExpiryLabel(item.expiresAt)}</Badge>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button variant="steam" onClick={() => setEditing(item)}>
                        Edit
                      </Button>
                      <Button
                        variant="orange"
                        disabled={actions.used.isPending}
                        onClick={() =>
                          actions.used.mutate(item, { onSuccess: () => celebrate(`${item.name} is rescued.`) })
                        }
                      >
                        Mark used
                      </Button>
                      <Button
                        variant="navy"
                        disabled={actions.wasted.isPending}
                        onClick={() =>
                          actions.wasted.mutate(item, {
                            onSuccess: () =>
                              setToast({
                                text: `${item.name} marked wasted.`,
                                undo: () => undoWaste(item),
                              }),
                          })
                        }
                      >
                        Mark wasted
                      </Button>
                      <Button
                        disabled={actions.destroy.isPending}
                        onClick={() =>
                          actions.destroy.mutate(item, {
                            onSuccess: () =>
                              setToast({
                                text: `${item.name} left the pantry.`,
                                undo: () => undoDelete(item),
                              }),
                            onError: (error) => setToast({ text: unreachableMessage(error) }),
                          })
                        }
                      >
                        Delete
                      </Button>
                    </div>
                  </Card>
                </li>
              );
            })}
          </ul>
        )}
      </QueryGate>
      {editing ? (
        <EditCard
          item={editing}
          pending={actions.save.isPending}
          onClose={() => setEditing(null)}
          onSave={(patch) =>
            actions.save.mutate(
              { id: editing.id, patch },
              { onSuccess: () => setEditing(null) },
            )
          }
        />
      ) : null}
      {toast ? (
        <div
          role="status"
          className="sticker-card fixed bottom-24 left-1/2 z-40 flex w-[min(100%-2rem,28rem)] -translate-x-1/2 items-center gap-3 bg-kitchi-cream px-4 py-3 md:bottom-6"
        >
          <Mascot mood={toast.celebrate ? "celebrating" : "happy"} size="sm" />
          <p className="min-w-0 flex-1 text-sm font-extrabold text-kitchi-navy">{toast.text}</p>
          {toast.undo ? (
            <Button variant="steam" onClick={() => { toast.undo?.(); setToast(null); }}>
              Undo
            </Button>
          ) : null}
          <Button variant="steam" onClick={() => setToast(null)}>
            OK
          </Button>
        </div>
      ) : null}
    </PageFrame>
  );

  function undoDelete(item: Ingredient) {
    actions.restore.mutate({
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      category: item.category,
      expiresAt: item.expiresAt,
      estimatedPrice: item.estimatedPrice,
    });
  }

  function undoWaste(item: Ingredient) {
    actions.reactivate.mutate(item.id);
  }
}

function EditCard({
  item,
  pending,
  onClose,
  onSave,
}: {
  item: Ingredient;
  pending: boolean;
  onClose: () => void;
  onSave: (patch: { name: string; quantity: number; unit: string; category: IngredientCategory; expiresAt: string; estimatedPrice: number }) => void;
}) {
  const [name, setName] = useState(item.name);
  const [quantity, setQuantity] = useState(String(item.quantity));
  const [unit, setUnit] = useState(item.unit);
  const [category, setCategory] = useState(item.category);
  const [expiresAt, setExpiresAt] = useState(item.expiresAt.slice(0, 10));
  const [price, setPrice] = useState(String(item.estimatedPrice));

  return (
    <Card className="mt-4 px-4 py-4">
      <h2 className="text-xl">Edit {item.name}</h2>
      <form
        className="mt-3 grid gap-3 sm:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault();
          onSave({
            name: name.trim(),
            quantity: Number(quantity),
            unit: unit.trim(),
            category,
            expiresAt,
            estimatedPrice: Number(price),
          });
        }}
      >
        <label className="text-sm font-extrabold">
          Name
          <input className="field" value={name} onChange={(event) => setName(event.target.value)} required />
        </label>
        <label className="text-sm font-extrabold">
          Quantity
          <input className="field" type="number" min="0.001" step="0.001" value={quantity} onChange={(event) => setQuantity(event.target.value)} required />
        </label>
        <label className="text-sm font-extrabold">
          Unit
          <input className="field" value={unit} onChange={(event) => setUnit(event.target.value)} required />
        </label>
        <label className="text-sm font-extrabold">
          Category
          <select className="field" value={category} onChange={(event) => setCategory(event.target.value as IngredientCategory)}>
            {INGREDIENT_CATEGORIES.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </label>
        <label className="text-sm font-extrabold">
          Expiry
          <input className="field" type="date" value={expiresAt} onChange={(event) => setExpiresAt(event.target.value)} required />
        </label>
        <label className="text-sm font-extrabold">
          Estimated price
          <input className="field" type="number" min="0" step="0.01" value={price} onChange={(event) => setPrice(event.target.value)} required />
        </label>
        <div className="flex gap-2 sm:col-span-2">
          <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save"}</Button>
          <Button type="button" variant="steam" onClick={onClose}>Cancel</Button>
        </div>
      </form>
    </Card>
  );
}
