"use client";

import { useState, type KeyboardEvent } from "react";
import { ManualForm } from "@/components/add/manual-form";
import { ScanPanel } from "@/components/add/scan-panel";
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
        description="Scan a barcode or photo, or type it in. Everything waits for your confirm before it hits the pantry."
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
        <Card className="mt-4 px-6 py-8 text-center">
          <div
            role="tabpanel"
            id="add-panel-scan"
            aria-labelledby="add-tab-scan"
            hidden={tab !== "scan"}
          >
            <ScanPanel />
          </div>
          <div
            role="tabpanel"
            id="add-panel-manual"
            aria-labelledby="add-tab-manual"
            hidden={tab !== "manual"}
          >
            <h2 className="text-2xl">Write it in by hand</h2>
            <p className="mx-auto mt-2 max-w-md text-kitchi-navy/75">
              Name, quantity, and a use-by date land in the pantry after you check them.
            </p>
            <ManualForm />
          </div>
        </Card>
      </div>
    </PageFrame>
  );
}
