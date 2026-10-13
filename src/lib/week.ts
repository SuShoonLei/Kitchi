import {
  endOfWeek,
  format,
  isWithinInterval,
  parseISO,
  startOfDay,
  startOfWeek,
} from "date-fns";
import type { EatingOutEntry, GroceryTrip, Meal, WeekSummary } from "@/lib/types";

export type WeekRange = {
  weekStart: Date;
  weekEnd: Date;
};

// Weeks run Monday 00:00 through Sunday 23:59 in the local timezone.
export function getWeekRange(date: Date): WeekRange {
  return {
    weekStart: startOfDay(startOfWeek(date, { weekStartsOn: 1 })),
    weekEnd: endOfWeek(date, { weekStartsOn: 1 }),
  };
}

export function weekKey(date: Date): string {
  return format(getWeekRange(date).weekStart, "yyyy-MM-dd");
}

export function isDateInWeek(isoDate: string, range: WeekRange): boolean {
  return isWithinInterval(parseISO(isoDate), {
    start: range.weekStart,
    end: range.weekEnd,
  });
}

export function formatWeekLabel(weekStart: string, weekEnd: string): string {
  return `${format(parseISO(weekStart), "MMM d")} – ${format(parseISO(weekEnd), "MMM d")}`;
}

export function isCurrentWeek(weekStart: string, now = new Date()): boolean {
  return weekStart === weekKey(now);
}

export function groupByWeek<T>(
  items: readonly T[],
  getDate: (item: T) => string | Date,
): Map<string, T[]> {
  const groups = new Map<string, T[]>();

  for (const item of items) {
    const value = getDate(item);
    const date = typeof value === "string" ? parseISO(value) : value;
    const key = weekKey(date);
    const bucket = groups.get(key);
    if (bucket) bucket.push(item);
    else groups.set(key, [item]);
  }

  return groups;
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function sumBy<T>(items: readonly T[] | undefined, read: (item: T) => number): number {
  if (!items) return 0;
  return roundMoney(items.reduce((total, item) => total + read(item), 0));
}

export function buildWeekSummaries(
  trips: readonly GroceryTrip[],
  eatingOut: readonly EatingOutEntry[],
  meals: readonly Meal[],
  now = new Date(),
): WeekSummary[] {
  const tripsByWeek = groupByWeek(trips, (trip) => trip.date);
  const eatingByWeek = groupByWeek(eatingOut, (entry) => entry.date);
  const mealsByWeek = groupByWeek(meals, (meal) => meal.cookedAt);
  const currentKey = weekKey(now);
  const keys = new Set<string>([
    currentKey,
    ...tripsByWeek.keys(),
    ...eatingByWeek.keys(),
    ...mealsByWeek.keys(),
  ]);

  const summaries: WeekSummary[] = [];

  for (const key of keys) {
    if (key > currentKey) continue;
    const range = getWeekRange(parseISO(key));
    const weekMeals = mealsByWeek.get(key) ?? [];
    summaries.push({
      weekStart: key,
      weekEnd: format(range.weekEnd, "yyyy-MM-dd"),
      groceryTotal: sumBy(tripsByWeek.get(key), (trip) => trip.total),
      eatingOutTotal: sumBy(eatingByWeek.get(key), (entry) => entry.amount),
      foodSavedCount: weekMeals.length,
      moneySaved: sumBy(weekMeals, (meal) => meal.moneySaved),
    });
  }

  summaries.sort((a, b) => (a.weekStart < b.weekStart ? 1 : -1));
  return summaries;
}
