"use client";

import { Chip } from "@/components/ui/sticker";
import { CUISINES } from "@/lib/types";
import { useFridgeStore, useStoreReady } from "@/store/use-fridge-store";

export function CuisineSelector() {
  const ready = useStoreReady();
  const selected = useFridgeStore((state) => state.settings.preferredCuisines);
  const toggleCuisine = useFridgeStore((state) => state.toggleCuisine);

  return (
    <section className="mt-8" aria-labelledby="cuisine-heading">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 id="cuisine-heading" className="text-3xl text-kitchi-navy">
          Cuisines you cook
        </h2>
        <p className="text-sm font-extrabold text-kitchi-navy/60" aria-live="polite">
          {!ready ? "Loading" : selected.length === 0 ? "No preference yet" : `${selected.length} selected`}
        </p>
      </div>
      <p className="mt-2 max-w-xl text-kitchi-navy/75">
        Pick every cuisine meal ideas should lean toward. This choice is saved on this device.
      </p>
      <div
        role="group"
        aria-labelledby="cuisine-heading"
        aria-busy={!ready}
        className="mt-5 flex flex-wrap gap-2"
      >
        {CUISINES.map((cuisine) => {
          const pressed = ready && selected.includes(cuisine);
          return (
            <Chip
              key={cuisine}
              pressed={pressed}
              disabled={!ready}
              onClick={() => toggleCuisine(cuisine)}
            >
              {cuisine}
            </Chip>
          );
        })}
      </div>
      {selected.length === 0 ? (
        <p className="mt-3 text-sm text-kitchi-navy/70">
          No preference yet. Suggestions can stay broad until you choose.
        </p>
      ) : null}
    </section>
  );
}
