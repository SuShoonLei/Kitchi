"use client";

import { useFridgeStore } from "@/store/use-fridge-store";

/** Reloads the bundled demo journal so visitors see meal ideas immediately. */
export function useLoadSampleData() {
  return useFridgeStore((state) => state.loadSampleData);
}
