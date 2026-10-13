"use client";

import { useState, type KeyboardEvent } from "react";
import { Mascot } from "@/components/brand/mascot";
import { PageFrame, PageHeader } from "@/components/ui/page-header";
import { Card, Chip } from "@/components/ui/sticker";

const TABS = [
  { id: "scan", label: "Scan" },
  { id: "manual", label: "Manual" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function AddIngredients() {
  const [tab, setTab] = useState<TabId>("scan");

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const index = TABS.findIndex((item) => item.id === tab);
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    event.preventDefault();
    const direction = event.key === "ArrowRight" ? 1 : -1;
    const next = TABS[(index + direction + TABS.length) % TABS.length];
    setTab(next.id);
    document.getElementById(`add-tab-${next.id}`)?.focus();
  }

  return (
    <PageFrame>
      <PageHeader
        eyebrow="Bring food in"
        title="Add or scan"
        description="Let's cook something tasty. Photograph a shelf or type what you have. Both paths land in the pantry once they're built."
      />
      <div className="mt-8" onKeyDown={onKeyDown}>
        <div role="tablist" aria-label="How to add ingredients" className="flex gap-2">
          {TABS.map((item) => {
            const selected = tab === item.id;
            return (
              <Chip
                key={item.id}
                id={`add-tab-${item.id}`}
                role="tab"
                pressed={selected}
                aria-selected={selected}
                aria-controls={`add-panel-${item.id}`}
                tabIndex={selected ? 0 : -1}
                onClick={() => setTab(item.id)}
              >
                {item.label}
              </Chip>
            );
          })}
        </div>
        <Card className="mt-4 px-6 py-10 text-center">
          <div
            role="tabpanel"
            id="add-panel-scan"
            aria-labelledby="add-tab-scan"
            hidden={tab !== "scan"}
          >
            <Mascot mood="cooking" size="lg" className="mx-auto" />
            <h2 className="mt-3 text-2xl">Point the camera at the shelf</h2>
            <p className="mx-auto mt-2 max-w-md text-kitchi-navy/75">
              A photo of the fridge will become ingredients here. Scanning is the next chapter, so this side stays empty for now.
            </p>
          </div>
          <div
            role="tabpanel"
            id="add-panel-manual"
            aria-labelledby="add-tab-manual"
            hidden={tab !== "manual"}
          >
            <Mascot mood="happy" size="lg" className="mx-auto" />
            <h2 className="mt-3 text-2xl">Write it in by hand</h2>
            <p className="mx-auto mt-2 max-w-md text-kitchi-navy/75">
              Name, quantity, and a use-by date will go on a small card. The form arrives with the rest of the pantry tools.
            </p>
          </div>
        </Card>
      </div>
    </PageFrame>
  );
}
