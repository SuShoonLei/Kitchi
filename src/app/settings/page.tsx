import type { Metadata } from "next";
import { AboutKitchi } from "@/components/settings/about-kitchi";
import { BudgetPlaceholder } from "@/components/settings/budget-placeholder";
import { CuisineSelector } from "@/components/settings/cuisine-selector";
import { PageFrame, PageHeader } from "@/components/ui/page-header";

export const metadata: Metadata = {
  title: "Settings",
};

export default function SettingsPage() {
  return (
    <PageFrame>
      <PageHeader
        eyebrow="How you eat"
        title="Settings"
        description="Tell Kitchi which cuisines belong in the rotation. The eating-out budget sits beside them."
      />
      <CuisineSelector />
      <BudgetPlaceholder />
      <AboutKitchi />
    </PageFrame>
  );
}
