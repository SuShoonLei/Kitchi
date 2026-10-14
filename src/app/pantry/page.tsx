import type { Metadata } from "next";
import { PantryView } from "@/components/pantry/pantry-view";

export const metadata: Metadata = {
  title: "Pantry",
};

export default function PantryPage() {
  return <PantryView />;
}
