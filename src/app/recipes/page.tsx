import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/ui/placeholder-page";

export const metadata: Metadata = {
  title: "Meals",
};

export default function RecipesPage() {
  return (
    <PlaceholderPage
      eyebrow="From the fridge"
      title="Meal ideas"
      description="Let's cook something tasty from what you already have, starting with whatever needs love first."
      emptyTitle="The pot is warmed up"
      emptyDescription="Recipe ideas will bubble up once the pantry has something worth cooking."
      mood="cooking"
    />
  );
}
