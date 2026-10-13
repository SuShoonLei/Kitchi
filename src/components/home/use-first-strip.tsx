"use client";

import { Mascot } from "@/components/brand/mascot";
import { formatExpiryLabel, getExpiryStatus, ingredientsToUseFirst } from "@/lib/expiry";
import { useFridgeStore, useStoreReady } from "@/store/use-fridge-store";

const LEGEND = [
  { status: "urgent", label: "Today or expired" },
  { status: "soon", label: "Use soon" },
  { status: "fresh", label: "Fresh" },
] as const;

export function UseFirstStrip() {
  const ready = useStoreReady();
  const ingredients = useFridgeStore((state) => state.ingredients);
  const urgent = ready ? ingredientsToUseFirst(ingredients) : [];
  const lead = urgent[0];

  return (
    <section className="mt-8" aria-labelledby="use-first-heading" aria-busy={!ready}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-extrabold tracking-[0.14em] text-kitchi-red uppercase">Fridge Rescue</p>
          <h2 id="use-first-heading" className="mt-1 text-3xl text-kitchi-navy">
            Use these first
          </h2>
          <p className="mt-1 max-w-xl text-sm text-kitchi-navy/70">
            {lead ? `${lead.name} is calling. Rescue it before it sulks.` : "These ones are closest to the edge."}
          </p>
        </div>
        <ul className="flex flex-wrap gap-3 text-xs font-extrabold text-kitchi-navy/70">
          {LEGEND.map((item) => (
            <li key={item.status} className="flex items-center gap-1.5">
              <span className="expiry-dot" data-expiry={item.status} />
              {item.label}
            </li>
          ))}
        </ul>
      </div>
      {ready ? (
        <ul className="use-first-scroller mt-4 list-none p-0" aria-label="Ingredients to use first">
          {urgent.map((ingredient) => {
            const status = getExpiryStatus(ingredient.expiresAt);
            return (
              <li key={ingredient.id} className="use-chip" data-expiry={status}>
                <strong>{ingredient.name}</strong>
                <span>{formatExpiryLabel(ingredient.expiresAt)}</span>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="mt-4 flex items-center gap-3" aria-hidden="true">
          <Mascot mood="cooking" size="sm" />
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="h-16 w-36 animate-pulse rounded-2xl bg-kitchi-steam" />
          ))}
        </div>
      )}
    </section>
  );
}
