import type { Metadata } from "next";
import { AddIngredients } from "@/components/add/add-ingredients";

export const metadata: Metadata = {
  title: "Add ingredients",
};

export default function AddPage() {
  return <AddIngredients />;
}
