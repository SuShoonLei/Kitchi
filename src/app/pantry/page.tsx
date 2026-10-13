import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/ui/placeholder-page";

export const metadata: Metadata = {
  title: "Pantry",
};

export default function PantryPage() {
  return (
    <PlaceholderPage
      eyebrow="On the shelf"
      title="Pantry"
      description="Everything you bought gets a spot here, with the loudest expiry dates first."
      emptyTitle="The pantry's having a nap"
      emptyDescription="Add some food and it'll line up here with green, yellow, and red stickers."
      mood="sleepy"
    />
  );
}
