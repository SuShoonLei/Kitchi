import type { Metadata } from "next";
import { Suspense } from "react";
import { SpendingView } from "@/components/spending/spending-view";
import { SkeletonGrid } from "@/components/ui/query-state";

export const metadata: Metadata = {
  title: "Spending",
};

export default function SpendingPage() {
  return (
    <Suspense fallback={<SkeletonGrid />}>
      <SpendingView />
    </Suspense>
  );
}
