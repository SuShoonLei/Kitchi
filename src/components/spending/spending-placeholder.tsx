"use client";

import { useSearchParams } from "next/navigation";
import { EmptyState } from "@/components/ui/empty-state";
import { PageFrame, PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/sticker";
import { formatWeekLabel, getWeekRange, weekKey } from "@/lib/week";
import { format, parseISO } from "date-fns";

function weekFromQuery(value: string | null): string | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = parseISO(value);
  if (Number.isNaN(date.getTime())) return null;
  const range = getWeekRange(date);
  const start = weekKey(date);
  return formatWeekLabel(start, format(range.weekEnd, "yyyy-MM-dd"));
}

export function SpendingPlaceholder() {
  const params = useSearchParams();
  const weekLabel = weekFromQuery(params.get("week"));

  return (
    <PageFrame>
      <PageHeader
        eyebrow="The ledger"
        title="Spending"
        description="Grocery runs and meals out, totaled from Monday to Sunday, will live in this cheerful ledger."
      />
      {weekLabel ? (
        <Card className="mt-6 bg-kitchi-yellow px-4 py-3 text-sm font-extrabold text-kitchi-navy">
          Opened from the week of {weekLabel}. The week detail view is next.
        </Card>
      ) : null}
      <EmptyState
        title="The notebook is still blank"
        mood="sleepy"
        description="Weekly grocery totals and an optional eating-out budget will be written here, one Monday-to-Sunday spread at a time."
      />
    </PageFrame>
  );
}
