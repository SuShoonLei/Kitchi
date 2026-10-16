"use client";

import { useState } from "react";
import { Chip, Button, Card } from "@/components/ui/sticker";
import { QueryGate } from "@/components/ui/query-state";
import { isLocalMode } from "@/lib/config";
import { CUISINES, type Cuisine } from "@/lib/types";
import { useDeleteAccount, useSaveSettings, useSettings } from "@/lib/use-journal";
import { isApiError } from "@/lib/wire";

export function SettingsForm() {
  const settings = useSettings();
  return (
    <QueryGate isLoading={settings.isLoading} error={settings.error} onRetry={() => void settings.refetch()}>
      {settings.data ? <SettingsEditor initial={settings.data} /> : null}
    </QueryGate>
  );
}

function SettingsEditor({
  initial,
}: {
  initial: { preferredCuisines: Cuisine[]; currency: string; eatingOutBudgetWeekly: number | null };
}) {
  const save = useSaveSettings();
  const wipe = useDeleteAccount();
  const [cuisines, setCuisines] = useState<Cuisine[]>(initial.preferredCuisines);
  const [currency, setCurrency] = useState(initial.currency);
  const [budget, setBudget] = useState(initial.eatingOutBudgetWeekly == null ? "" : String(initial.eatingOutBudgetWeekly));
  const [confirming, setConfirming] = useState(false);

  const fieldErrors = isApiError(save.error) ? save.error.fieldErrors : {};

  return (
    <>
      <section className="mt-8" aria-labelledby="cuisine-heading">
        <h2 id="cuisine-heading" className="text-3xl text-kitchi-navy">Cuisines you cook</h2>
        <div role="group" aria-labelledby="cuisine-heading" className="mt-4 flex flex-wrap gap-2">
          {CUISINES.map((cuisine) => {
            const pressed = cuisines.includes(cuisine);
            return (
              <Chip
                key={cuisine}
                pressed={pressed}
                onClick={() =>
                  setCuisines((current) =>
                    current.includes(cuisine) ? current.filter((item) => item !== cuisine) : [...current, cuisine],
                  )
                }
              >
                {cuisine}
              </Chip>
            );
          })}
        </div>
        {fieldErrors.cuisines ? <p className="mt-2 text-sm font-bold text-kitchi-red">{fieldErrors.cuisines}</p> : null}
      </section>
      <Card className="mt-8 px-5 py-6">
        <h2 className="text-2xl">Eating-out budget</h2>
        <p className="mt-2 max-w-xl text-kitchi-navy/75">An optional weekly cap, counted Monday to Sunday. Leave it blank for no budget.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-extrabold">
            Weekly budget
            <input className="field" inputMode="decimal" value={budget} onChange={(event) => setBudget(event.target.value)} placeholder="Not set" />
            {fieldErrors.eatingOutBudgetWeekly ? <span className="mt-1 block text-kitchi-red">{fieldErrors.eatingOutBudgetWeekly}</span> : null}
          </label>
          <label className="text-sm font-extrabold">
            Currency
            <input className="field" maxLength={3} value={currency} onChange={(event) => setCurrency(event.target.value)} />
            {fieldErrors.currency ? <span className="mt-1 block text-kitchi-red">{fieldErrors.currency}</span> : null}
          </label>
        </div>
        <Button
          className="mt-4"
          disabled={save.isPending}
          onClick={() =>
            save.mutate({
              preferredCuisines: cuisines,
              currency: currency.trim(),
              eatingOutBudgetWeekly: budget.trim() === "" ? null : Number(budget),
            })
          }
        >
          {save.isPending ? "Saving…" : "Save settings"}
        </Button>
        {save.isSuccess ? <p className="mt-3 text-sm font-extrabold text-kitchi-green" role="status">Saved.</p> : null}
      </Card>
      <Card className="mt-8 px-5 py-6">
        <h2 className="text-2xl">Delete all my data</h2>
        <p className="mt-2 max-w-xl text-kitchi-navy/75">
          {isLocalMode()
            ? "This clears everything stored on this device only."
            : "This deletes the anonymous account and everything tied to this device."}
        </p>
        {confirming ? (
          <div className="mt-4" role="dialog" aria-labelledby="delete-title">
            <p id="delete-title" className="font-extrabold">Delete everything? This cannot be undone.</p>
            <div className="mt-3 flex gap-2">
              <Button disabled={wipe.isPending} onClick={() => wipe.mutate()}>
                {wipe.isPending ? "Deleting…" : "Yes, delete it"}
              </Button>
              <Button variant="steam" onClick={() => setConfirming(false)}>Cancel</Button>
            </div>
          </div>
        ) : (
          <Button className="mt-4" variant="navy" onClick={() => setConfirming(true)}>
            Delete all my data
          </Button>
        )}
      </Card>
    </>
  );
}
