"use client";

import { Mascot } from "@/components/brand/mascot";
import { WeekFolderCard } from "@/components/home/week-folder-card";
import { ErrorState } from "@/components/ui/query-state";
import { useSettings, useWeeks } from "@/lib/use-journal";

export function WeekGrid() {
  const weeks = useWeeks();
  const settings = useSettings();
  const ready = !weeks.isLoading;
  const currency = settings.data?.currency ?? "USD";
  const summaries = weeks.data ?? [];
  if (weeks.error) return <ErrorState error={weeks.error} onRetry={() => void weeks.refetch()} />;

  return (
    <section className="mt-10" aria-labelledby="weeks-heading" aria-busy={!ready}>
      <div className="mb-5 flex items-end justify-between gap-4">
        <h2 id="weeks-heading" className="text-3xl text-kitchi-navy">
          Week folders
        </h2>
        <p className="text-sm font-bold text-kitchi-navy/60">Monday to Sunday</p>
      </div>
      {ready ? (
        <ul className="grid list-none grid-cols-1 gap-x-8 gap-y-14 p-0 sm:grid-cols-2 xl:grid-cols-3">
          {summaries.map((summary, index) => (
            <WeekFolderCard
              key={summary.weekStart}
              summary={summary}
              index={index}
              currency={currency}
            />
          ))}
        </ul>
      ) : (
        <div>
          <p className="sr-only">Loading week folders.</p>
          <div className="mb-4 flex items-center gap-3" aria-hidden="true">
            <Mascot mood="cooking" size="sm" />
            <p className="font-extrabold text-kitchi-navy/70">Warming up the stove…</p>
          </div>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }, (_, index) => (
              <div
                key={index}
                aria-hidden="true"
                className="aspect-[0.716] animate-pulse rounded-[18px] bg-kitchi-steam"
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
