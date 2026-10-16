import type { Metadata } from "next";
import { MealsView } from "@/components/meals/meals-view";

export const metadata: Metadata = {
  title: "Meals",
};

export default function RecipesPage() {
  return <MealsView />;
}
