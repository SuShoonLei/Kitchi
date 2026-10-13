"use client";

import { Card } from "@/components/ui/sticker";
import { formatMoney } from "@/lib/format";
import { useFridgeStore, useStoreReady } from "@/store/use-fridge-store";

export function BudgetPlaceholder() {
  const ready = useStoreReady();
  const budget = useFridgeStore((state) => state.settings.eatingOutBudgetWeekly);
  const currency = useFridgeStore((state) => state.settings.currency);
  const label = !ready ? "Loading" : budget == null ? "Not set" : formatMoney(budget, currency);

  return (
    <Card className="mt-10 px-5 py-6">
      <section aria-labelledby="budget-heading">
        <h2 id="budget-heading" className="text-2xl text-kitchi-navy">
          Eating-out budget
        </h2>
        <p className="mt-2 max-w-xl text-kitchi-navy/75">
          An optional weekly cap, counted Monday to Sunday. Setting the amount comes in a later step.
        </p>
        <p className="mt-4 font-display text-4xl text-kitchi-navy">{label}</p>
        <p className="mt-1 text-sm font-bold text-kitchi-navy/60">Amounts in {currency}</p>
      </section>
    </Card>
  );
}
