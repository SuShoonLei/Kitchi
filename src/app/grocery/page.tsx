import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/ui/placeholder-page";

export const metadata: Metadata = {
  title: "Grocery list",
};

export default function GroceryPage() {
  return (
    <PlaceholderPage
      eyebrow="The next shop"
      title="Grocery list"
      description="A list shaped by how you actually eat, so the cart fills the gaps instead of doubling up."
      emptyTitle="The basket is empty"
      emptyDescription="Checked items and a list drawn from your habits will land here. Nothing to tick off today."
      mood="sleepy"
    />
  );
}
