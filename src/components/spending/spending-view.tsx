"use client";

import { parseISO } from "date-fns";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Mascot } from "@/components/brand/mascot";
import { EmptyState } from "@/components/ui/empty-state";
import { PageFrame, PageHeader } from "@/components/ui/page-header";
import { QueryGate } from "@/components/ui/query-state";
import { Badge, Button, Card } from "@/components/ui/sticker";
import { isDemoMode } from "@/lib/config";
import { formatMoney } from "@/lib/format";
import type { BudgetStatus, EatingOutEntry } from "@/lib/types";
import { useEatingActions, useEatingOut, useSettings, useWeekDetail, useWeeks } from "@/lib/use-journal";
import { formatWeekLabel, weekKey } from "@/lib/week";
import { useFridgeStore } from "@/store/use-fridge-store";
import { isApiError } from "@/lib/wire";

const BADGE: Record<BudgetStatus, { tone: "quiet" | "green" | "yellow" | "red"; label: string }> = {
  NO_BUDGET: { tone: "quiet", label: "No budget" },
  UNDER: { tone: "green", label: "Under budget" },
  NEAR: { tone: "yellow", label: "Near budget" },
  OVER: { tone: "red", label: "Over budget" },
};

export function SpendingView() {
  const params = useSearchParams();
  const week = params.get("week");
  const weeks = useWeeks();
  const detail = useWeekDetail(week);
  const entries = useEatingOut();
  const settings = useSettings();
  const actions = useEatingActions();
  const currency = settings.data?.currency ?? "USD";
  const [place, setPlace] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [note, setNote] = useState("");
  const [editing, setEditing] = useState<EatingOutEntry | null>(null);
  const [saved, setSaved] = useState(false);
  const localTrips = useFridgeStore((state) => state.groceryTrips);
  const localEating = useFridgeStore((state) => state.eatingOut);
  const localMeals = useFridgeStore((state) => state.meals);
  const demoWeek = isDemoMode() && week
    ? {
        trips: localTrips.filter((trip) => weekKey(parseISO(trip.date)) === week),
        eatingOut: localEating.filter((entry) => weekKey(parseISO(entry.date)) === week),
        meals: localMeals.filter((meal) => weekKey(parseISO(meal.cookedAt)) === week),
      }
    : null;

  return (
    <PageFrame>
      <PageHeader
        eyebrow="The ledger"
        title="Spending"
        description="Grocery runs and meals out, totaled from Monday to Sunday."
      />
      {demoWeek ? (
        <Card className="mt-6 px-4 py-4">
          <h2 className="text-2xl">Week details</h2>
          <ul className="mt-3 list-none space-y-1 p-0 text-sm">
            {demoWeek.trips.map((trip) => (
              <li key={trip.id}>{trip.store} · {formatMoney(trip.total, currency)}</li>
            ))}
            {demoWeek.eatingOut.map((entry) => (
              <li key={entry.id}>{entry.place} · {formatMoney(entry.amount, currency)}</li>
            ))}
            {demoWeek.meals.map((meal) => (
              <li key={meal.id}>{meal.name} · saved {formatMoney(meal.moneySaved, currency)}</li>
            ))}
          </ul>
        </Card>
      ) : null}
      {week && detail.data ? (
        <Card className="mt-6 px-4 py-4">
          <h2 className="text-2xl">Week of {formatWeekLabel(detail.data.weekStart, detail.data.weekEnd)}</h2>
          <p className="mt-1 text-sm font-bold text-kitchi-navy/70">
            Groceries {formatMoney(detail.data.groceryTotal, currency)} · Eating out {formatMoney(detail.data.eatingOutTotal, currency)} · Saved {formatMoney(detail.data.moneySaved, currency)}
          </p>
          <ul className="mt-3 list-none space-y-1 p-0 text-sm">
            {detail.data.trips.map((trip) => (
              <li key={trip.id}>{trip.store} · {formatMoney(trip.total, currency)}</li>
            ))}
            {detail.data.eatingOut.map((entry) => (
              <li key={entry.id}>{entry.place} · {formatMoney(entry.amount, currency)}</li>
            ))}
            {detail.data.meals.map((meal) => (
              <li key={meal.id}>{meal.name} · saved {formatMoney(meal.moneySaved, currency)}</li>
            ))}
          </ul>
        </Card>
      ) : null}
      {week && detail.error ? (
        <p className="mt-4 text-sm font-bold text-kitchi-red">{isApiError(detail.error) ? detail.error.message : "That week could not be opened."}</p>
      ) : null}
      <Card className="mt-6 px-4 py-4">
        <h2 className="text-xl">Eating out</h2>
        <form
          className="mt-3 grid gap-3 sm:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            const payload = { entryDate: date, place: place.trim(), amount: Number(amount), note: note.trim() || undefined };
            const done = () => {
              setPlace("");
              setAmount("");
              setNote("");
              setSaved(true);
              setEditing(null);
            };
            if (editing) actions.save.mutate({ id: editing.id, entry: { ...editing, date, place: payload.place, amount: payload.amount, note: payload.note } }, { onSuccess: done });
            else actions.create.mutate(payload, { onSuccess: done });
          }}
        >
          <input className="field" type="date" value={date} onChange={(event) => setDate(event.target.value)} required />
          <input className="field" placeholder="Place" value={place} onChange={(event) => setPlace(event.target.value)} required />
          <input className="field" type="number" min="0" step="0.01" placeholder="Amount" value={amount} onChange={(event) => setAmount(event.target.value)} required />
          <input className="field" placeholder="Note" value={note} onChange={(event) => setNote(event.target.value)} />
          <Button type="submit" disabled={actions.create.isPending || actions.save.isPending}>
            {actions.create.isPending || actions.save.isPending ? "Saving…" : editing ? "Save changes" : "Add meal out"}
          </Button>
        </form>
        {saved ? (
          <div className="mt-3 flex items-center gap-3" role="status">
            <Mascot mood="happy" size="sm" />
            <p className="font-extrabold">Noted.</p>
          </div>
        ) : null}
      </Card>
      <QueryGate isLoading={weeks.isLoading || entries.isLoading} error={weeks.error ?? entries.error} onRetry={() => { void weeks.refetch(); void entries.refetch(); }}>
        {(weeks.data ?? []).length === 0 ? (
          <EmptyState title="The notebook is still blank" mood="sleepy" description="A grocery trip or a meal out will open the first week." />
        ) : (
          <ul className="mt-4 list-none space-y-3 p-0">
            {(weeks.data ?? []).map((row) => {
              const badge = BADGE[row.budgetStatus ?? "NO_BUDGET"];
              return (
                <li key={row.weekStart}>
                  <Card className="px-4 py-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h2 className="text-xl">{formatWeekLabel(row.weekStart, row.weekEnd)}</h2>
                      <Badge tone={badge.tone}>{badge.label}</Badge>
                    </div>
                    <p className="mt-2 text-sm font-bold text-kitchi-navy/75">
                      Groceries {formatMoney(row.groceryTotal, currency)} · Eating out {formatMoney(row.eatingOutTotal, currency)} · Saved {formatMoney(row.moneySaved, currency)}
                    </p>
                  </Card>
                </li>
              );
            })}
          </ul>
        )}
        <ul className="mt-4 list-none space-y-2 p-0">
          {(entries.data ?? []).map((entry) => (
            <li key={entry.id} className="flex flex-wrap items-center gap-2 text-sm font-bold">
              <span className="flex-1">{entry.date} · {entry.place} · {formatMoney(entry.amount, currency)}{entry.note ? ` · ${entry.note}` : ""}</span>
              <Button variant="steam" onClick={() => { setEditing(entry); setDate(entry.date); setPlace(entry.place); setAmount(String(entry.amount)); setNote(entry.note ?? ""); }}>
                Edit
              </Button>
              <Button variant="navy" disabled={actions.destroy.isPending} onClick={() => actions.destroy.mutate(entry.id)}>
                Delete
              </Button>
            </li>
          ))}
        </ul>
      </QueryGate>
    </PageFrame>
  );
}
