"use client";

import { useState } from "react";
import { Mascot } from "@/components/brand/mascot";
import { EmptyState } from "@/components/ui/empty-state";
import { PageFrame, PageHeader } from "@/components/ui/page-header";
import { QueryGate } from "@/components/ui/query-state";
import { Button, Card } from "@/components/ui/sticker";
import { formatMoney } from "@/lib/format";
import type { GroceryItem } from "@/lib/types";
import { useGroceryActions, useGroceryItems, useSettings } from "@/lib/use-journal";

export function GroceryView() {
  const list = useGroceryItems();
  const settings = useSettings();
  const actions = useGroceryActions();
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unit, setUnit] = useState("count");
  const [price, setPrice] = useState("");
  const [store, setStore] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const currency = settings.data?.currency ?? "USD";
  const items = list.data ?? [];
  const checked = items.filter((item) => item.checked);
  const total = checked.reduce((sum, item) => sum + Number(item.estimatedPrice), 0);

  return (
    <PageFrame>
      <PageHeader
        eyebrow="The next shop"
        title="Grocery list"
        description="Tick what goes in the basket, then check out into a trip."
      />
      <form
        className="mt-6 grid gap-3 sm:grid-cols-4"
        onSubmit={(event) => {
          event.preventDefault();
          actions.create.mutate(
            { name: name.trim(), quantity: Number(quantity), unit: unit.trim() || "count", estimatedPrice: Number(price) },
            { onSuccess: () => { setName(""); setPrice(""); } },
          );
        }}
      >
        <input className="field sm:col-span-2" placeholder="Item" value={name} onChange={(event) => setName(event.target.value)} required />
        <input className="field" type="number" min="0.001" step="0.001" value={quantity} onChange={(event) => setQuantity(event.target.value)} required />
        <input className="field" placeholder="Unit" value={unit} onChange={(event) => setUnit(event.target.value)} required />
        <input className="field" type="number" min="0" step="0.01" placeholder="Price" value={price} onChange={(event) => setPrice(event.target.value)} required />
        <Button type="submit" className="sm:col-span-2" disabled={actions.create.isPending}>
          {actions.create.isPending ? "Adding…" : "Add item"}
        </Button>
      </form>
      <QueryGate isLoading={list.isLoading} error={list.error} onRetry={() => void list.refetch()}>
        {items.length === 0 ? (
          <EmptyState title="The basket is empty" mood="sleepy" description="Add something you mean to buy. Checked items become a trip." />
        ) : (
          <ul className="mt-4 list-none space-y-3 p-0">
            {items.map((item) => (
              <li key={item.id}>
                <GroceryRow
                  item={item}
                  currency={currency}
                  editing={editing === item.id}
                  onEdit={() => setEditing(item.id)}
                  onClose={() => setEditing(null)}
                  onToggle={() => actions.patch.mutate({ id: item.id, body: { checked: !item.checked } })}
                  onDelete={() => actions.destroy.mutate(item.id)}
                  onSave={(body) => actions.patch.mutate({ id: item.id, body }, { onSuccess: () => setEditing(null) })}
                  pending={actions.patch.isPending || actions.destroy.isPending}
                />
              </li>
            ))}
          </ul>
        )}
      </QueryGate>
      <Card className="mt-6 px-4 py-4">
        <h2 className="text-xl">Checkout</h2>
        <p className="mt-1 text-sm text-kitchi-navy/70">
          {checked.length} checked · {formatMoney(total, currency)}
        </p>
        <form
          className="mt-3 flex flex-wrap gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            actions.checkout.mutate(store.trim(), {
              onSuccess: () => {
                setDone(formatMoney(total, currency));
                setStore("");
              },
            });
          }}
        >
          <input className="field max-w-xs" placeholder="Store name" value={store} onChange={(event) => setStore(event.target.value)} required />
          <Button type="submit" disabled={actions.checkout.isPending || checked.length === 0}>
            {actions.checkout.isPending ? "Saving…" : "Checkout"}
          </Button>
          <Button type="button" variant="steam" disabled>
            Generate suggestions · coming soon
          </Button>
        </form>
        {done ? (
          <div className="mt-3 flex items-center gap-3" role="status">
            <Mascot mood="celebrating" size="sm" />
            <p className="font-extrabold">Trip saved at {done}.</p>
          </div>
        ) : null}
      </Card>
    </PageFrame>
  );
}

function GroceryRow({
  item,
  currency,
  editing,
  pending,
  onEdit,
  onClose,
  onToggle,
  onDelete,
  onSave,
}: {
  item: GroceryItem;
  currency: string;
  editing: boolean;
  pending: boolean;
  onEdit: () => void;
  onClose: () => void;
  onToggle: () => void;
  onDelete: () => void;
  onSave: (body: Partial<GroceryItem>) => void;
}) {
  const [name, setName] = useState(item.name);
  const [quantity, setQuantity] = useState(String(item.quantity));
  const [unit, setUnit] = useState(item.unit ?? "count");
  const [price, setPrice] = useState(String(item.estimatedPrice));
  return (
    <Card className="px-4 py-3">
      <div className="flex flex-wrap items-center gap-3">
        <input type="checkbox" checked={item.checked} onChange={onToggle} aria-label={`Check ${item.name}`} className="h-5 w-5" />
        <div className="min-w-0 flex-1">
          <p className="font-extrabold text-kitchi-navy">{item.name}</p>
          <p className="text-sm text-kitchi-navy/70">
            {item.quantity} {item.unit ?? "count"} · {formatMoney(Number(item.estimatedPrice), currency)}
          </p>
          {item.reason ? <p className="text-sm text-kitchi-navy/60">{item.reason}</p> : null}
        </div>
        <Button variant="steam" onClick={onEdit}>Edit</Button>
        <Button variant="navy" disabled={pending} onClick={onDelete}>Delete</Button>
      </div>
      {editing ? (
        <form
          className="mt-3 grid gap-2 sm:grid-cols-4"
          onSubmit={(event) => {
            event.preventDefault();
            onSave({ name: name.trim(), quantity: Number(quantity), unit, estimatedPrice: Number(price) });
          }}
        >
          <input className="field" value={name} onChange={(event) => setName(event.target.value)} required />
          <input className="field" type="number" min="0.001" step="0.001" value={quantity} onChange={(event) => setQuantity(event.target.value)} required />
          <input className="field" value={unit} onChange={(event) => setUnit(event.target.value)} required />
          <input className="field" type="number" min="0" step="0.01" value={price} onChange={(event) => setPrice(event.target.value)} required />
          <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save"}</Button>
          <Button type="button" variant="steam" onClick={onClose}>Cancel</Button>
        </form>
      ) : null}
    </Card>
  );
}
