import type { Metadata } from "next";
import { GroceryView } from "@/components/grocery/grocery-view";

export const metadata: Metadata = {
  title: "Grocery list",
};

export default function GroceryPage() {
  return <GroceryView />;
}
