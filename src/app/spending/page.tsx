import type { Metadata } from "next";
import { Suspense } from "react";
import { SpendingPlaceholder } from "@/components/spending/spending-placeholder";

export const metadata: Metadata = {
  title: "Spending",
};

export default function SpendingPage() {
  return (
    <Suspense fallback={null}>
      <SpendingPlaceholder />
    </Suspense>
  );
}
