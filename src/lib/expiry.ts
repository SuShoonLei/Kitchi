import { differenceInCalendarDays, parseISO, startOfDay } from "date-fns";
import type { ExpiryStatus, Ingredient } from "@/lib/types";

export function daysUntilExpiry(expiresAt: string, now = new Date()): number {
  return differenceInCalendarDays(startOfDay(parseISO(expiresAt)), startOfDay(now));
}

export function getExpiryStatus(expiresAt: string, now = new Date()): ExpiryStatus {
  const days = daysUntilExpiry(expiresAt, now);
  if (days <= 0) return "urgent";
  if (days <= 3) return "soon";
  return "fresh";
}

export function formatExpiryLabel(expiresAt: string, now = new Date()): string {
  const days = daysUntilExpiry(expiresAt, now);
  if (days < -1) return `Expired ${Math.abs(days)} days ago`;
  if (days === -1) return "Expired yesterday";
  if (days === 0) return "Use today";
  if (days === 1) return "Tomorrow";
  return `${days} days left`;
}

export function ingredientsToUseFirst(
  ingredients: readonly Ingredient[],
  now = new Date(),
  limit = 8,
): Ingredient[] {
  return [...ingredients]
    .sort((a, b) => parseISO(a.expiresAt).getTime() - parseISO(b.expiresAt).getTime())
    .filter((ingredient) => getExpiryStatus(ingredient.expiresAt, now) !== "fresh")
    .slice(0, limit);
}
