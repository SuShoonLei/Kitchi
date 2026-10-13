import { addDays, addWeeks, startOfWeek } from "date-fns";
import type {
  EatingOutEntry,
  GroceryItem,
  GroceryTrip,
  Ingredient,
  Meal,
  Settings,
} from "@/lib/types";

function atNoon(date: Date): string {
  const copy = new Date(date);
  copy.setHours(12, 0, 0, 0);
  if (copy.getTime() > Date.now()) return new Date().toISOString();
  return copy.toISOString();
}

function onWeekday(weeksAgo: number, dayOffset: number): string {
  const monday = startOfWeek(new Date(), { weekStartsOn: 1 });
  return atNoon(addDays(addWeeks(monday, -weeksAgo), dayOffset));
}

function fromToday(days: number): string {
  const date = addDays(new Date(), days);
  date.setHours(12, 0, 0, 0);
  return date.toISOString();
}

function groceryItem(
  id: string,
  name: string,
  quantity: number,
  estimatedPrice: number,
  checked = true,
): GroceryItem {
  return { id, name, quantity, checked, estimatedPrice };
}

export function createSeedIngredients(): Ingredient[] {
  const added = fromToday(-4);
  return [
    {
      id: "ing-cilantro",
      name: "Cilantro",
      quantity: 1,
      unit: "bunch",
      category: "produce",
      addedAt: fromToday(-6),
      expiresAt: fromToday(-1),
      estimatedPrice: 1.5,
    },
    {
      id: "ing-milk",
      name: "Whole milk",
      quantity: 1,
      unit: "liter",
      category: "dairy",
      addedAt: fromToday(-5),
      expiresAt: fromToday(0),
      estimatedPrice: 3.8,
    },
    {
      id: "ing-chicken",
      name: "Chicken thighs",
      quantity: 1.2,
      unit: "lb",
      category: "protein",
      addedAt: fromToday(-2),
      expiresAt: fromToday(1),
      estimatedPrice: 7.4,
    },
    {
      id: "ing-spinach",
      name: "Baby spinach",
      quantity: 5,
      unit: "oz",
      category: "produce",
      addedAt: fromToday(-2),
      expiresAt: fromToday(2),
      estimatedPrice: 3.2,
    },
    {
      id: "ing-tofu",
      name: "Firm tofu",
      quantity: 14,
      unit: "oz",
      category: "protein",
      addedAt: fromToday(-1),
      expiresAt: fromToday(2),
      estimatedPrice: 2.4,
    },
    {
      id: "ing-tomatoes",
      name: "Roma tomatoes",
      quantity: 4,
      unit: "count",
      category: "produce",
      addedAt: added,
      expiresAt: fromToday(3),
      estimatedPrice: 2.8,
    },
    {
      id: "ing-peppers",
      name: "Bell peppers",
      quantity: 2,
      unit: "count",
      category: "produce",
      addedAt: added,
      expiresAt: fromToday(4),
      estimatedPrice: 2.6,
    },
    {
      id: "ing-yogurt",
      name: "Plain yogurt",
      quantity: 2,
      unit: "cups",
      category: "dairy",
      addedAt: fromToday(-3),
      expiresAt: fromToday(6),
      estimatedPrice: 1.9,
    },
    {
      id: "ing-eggs",
      name: "Eggs",
      quantity: 8,
      unit: "count",
      category: "protein",
      addedAt: fromToday(-3),
      expiresAt: fromToday(12),
      estimatedPrice: 4.5,
    },
    {
      id: "ing-lemons",
      name: "Lemons",
      quantity: 3,
      unit: "count",
      category: "produce",
      addedAt: added,
      expiresAt: fromToday(14),
      estimatedPrice: 1.7,
    },
    {
      id: "ing-rice",
      name: "Jasmine rice",
      quantity: 2,
      unit: "lb",
      category: "grain",
      addedAt: fromToday(-20),
      expiresAt: fromToday(120),
      estimatedPrice: 3.4,
    },
    {
      id: "ing-fish-sauce",
      name: "Fish sauce",
      quantity: 1,
      unit: "bottle",
      category: "pantry",
      addedAt: fromToday(-30),
      expiresAt: fromToday(200),
      estimatedPrice: 4.1,
    },
  ];
}

export function createSeedMeals(): Meal[] {
  return [
    {
      id: "meal-tomato-eggs",
      name: "Tomato egg skillet",
      cuisine: "Western",
      ingredientsUsed: [
        { name: "Eggs", quantity: 2, unit: "count" },
        { name: "Roma tomatoes", quantity: 2, unit: "count" },
      ],
      cookedAt: onWeekday(0, 0),
      moneySaved: 8.4,
    },
    {
      id: "meal-chicken-curry",
      name: "Chicken thigh curry",
      cuisine: "Burmese",
      ingredientsUsed: [
        { name: "Chicken thighs", quantity: 0.8, unit: "lb" },
        { name: "Fish sauce", quantity: 1, unit: "tbsp" },
      ],
      cookedAt: onWeekday(1, 1),
      moneySaved: 11.5,
    },
    {
      id: "meal-tofu-basil",
      name: "Tofu basil stir-fry",
      cuisine: "Thai",
      ingredientsUsed: [
        { name: "Firm tofu", quantity: 7, unit: "oz" },
        { name: "Bell peppers", quantity: 1, unit: "count" },
      ],
      cookedAt: onWeekday(1, 3),
      moneySaved: 8.25,
    },
    {
      id: "meal-spinach-omelette",
      name: "Spinach omelette",
      cuisine: "Western",
      ingredientsUsed: [
        { name: "Eggs", quantity: 2, unit: "count" },
        { name: "Baby spinach", quantity: 2, unit: "oz" },
      ],
      cookedAt: onWeekday(1, 5),
      moneySaved: 6.75,
    },
    {
      id: "meal-lemongrass-soup",
      name: "Lemongrass chicken soup",
      cuisine: "Thai",
      ingredientsUsed: [{ name: "Chicken thighs", quantity: 0.5, unit: "lb" }],
      cookedAt: onWeekday(2, 2),
      moneySaved: 9.4,
    },
    {
      id: "meal-herb-rice",
      name: "Herb chicken rice",
      cuisine: "Burmese",
      ingredientsUsed: [
        { name: "Jasmine rice", quantity: 1, unit: "cup" },
        { name: "Cilantro", quantity: 0.5, unit: "bunch" },
      ],
      cookedAt: onWeekday(2, 4),
      moneySaved: 9.6,
    },
    {
      id: "meal-chili-noodles",
      name: "Chili garlic noodles",
      cuisine: "Chinese",
      ingredientsUsed: [{ name: "Bell peppers", quantity: 1, unit: "count" }],
      cookedAt: onWeekday(3, 0),
      moneySaved: 8.2,
    },
    {
      id: "meal-tomato-dal",
      name: "Tomato dal",
      cuisine: "Indian",
      ingredientsUsed: [{ name: "Roma tomatoes", quantity: 2, unit: "count" }],
      cookedAt: onWeekday(3, 2),
      moneySaved: 7.1,
    },
    {
      id: "meal-pepper-omelette",
      name: "Pepper omelette",
      cuisine: "Western",
      ingredientsUsed: [
        { name: "Eggs", quantity: 2, unit: "count" },
        { name: "Bell peppers", quantity: 1, unit: "count" },
      ],
      cookedAt: onWeekday(3, 4),
      moneySaved: 6.4,
    },
    {
      id: "meal-yogurt-rice",
      name: "Yogurt rice",
      cuisine: "Indian",
      ingredientsUsed: [
        { name: "Plain yogurt", quantity: 1, unit: "cup" },
        { name: "Jasmine rice", quantity: 1, unit: "cup" },
      ],
      cookedAt: onWeekday(3, 6),
      moneySaved: 5.8,
    },
  ];
}

export function createSeedGroceryTrips(): GroceryTrip[] {
  return [
    {
      id: "trip-current",
      date: onWeekday(0, 0),
      store: "Green Market",
      total: 46.8,
      items: [
        groceryItem("trip-current-chicken", "Chicken thighs", 1, 12.4),
        groceryItem("trip-current-produce", "Mixed produce", 1, 14.2),
        groceryItem("trip-current-dairy", "Dairy", 1, 11.8),
        groceryItem("trip-current-pantry", "Pantry staples", 1, 8.4),
      ],
    },
    {
      id: "trip-last",
      date: onWeekday(1, 1),
      store: "Corner Grocer",
      total: 72.15,
      items: [
        groceryItem("trip-last-rice", "Rice and noodles", 1, 16.4),
        groceryItem("trip-last-veg", "Market vegetables", 1, 22.75),
        groceryItem("trip-last-protein", "Chicken and tofu", 1, 21.1),
        groceryItem("trip-last-sauces", "Sauces and yogurt", 1, 11.9),
      ],
    },
    {
      id: "trip-two",
      date: onWeekday(2, 3),
      store: "Sunrise Foods",
      total: 61.4,
      items: [
        groceryItem("trip-two-fish", "Fish and lemons", 1, 18.6),
        groceryItem("trip-two-greens", "Greens", 1, 14.3),
        groceryItem("trip-two-dairy", "Eggs and milk", 1, 12.5),
        groceryItem("trip-two-rice", "Rice", 1, 16),
      ],
    },
    {
      id: "trip-three",
      date: onWeekday(3, 5),
      store: "Harbor Produce",
      total: 88.2,
      items: [
        groceryItem("trip-three-produce", "Produce haul", 1, 28.4),
        groceryItem("trip-three-protein", "Meat and tofu", 1, 31.15),
        groceryItem("trip-three-dairy", "Dairy", 1, 14.25),
        groceryItem("trip-three-pantry", "Pantry restock", 1, 14.4),
      ],
    },
  ];
}

export function createSeedEatingOut(): EatingOutEntry[] {
  return [
    { id: "out-current", date: onWeekday(0, 0), place: "Little Rangoon", amount: 18.5 },
    { id: "out-last-a", date: onWeekday(1, 2), place: "Basil & Chili", amount: 22 },
    { id: "out-last-b", date: onWeekday(1, 4), place: "Market stall lunch", amount: 12 },
    { id: "out-two", date: onWeekday(2, 5), place: "Sunday Noodle Bar", amount: 22.75 },
    { id: "out-three-a", date: onWeekday(3, 1), place: "Little Rangoon", amount: 24.8 },
    { id: "out-three-b", date: onWeekday(3, 4), place: "Corner counter", amount: 16.5 },
  ];
}

export function createSeedGroceryList(): GroceryItem[] {
  return [
    groceryItem("list-rice", "Jasmine rice", 1, 4.2, false),
    groceryItem("list-limes", "Limes", 4, 1.8, false),
    groceryItem("list-eggs", "Eggs", 12, 5.4, false),
    groceryItem("list-fish-sauce", "Fish sauce", 1, 4.1, false),
  ];
}

export function createSeedSettings(): Settings {
  return {
    preferredCuisines: ["Burmese", "Thai", "Italian"],
    eatingOutBudgetWeekly: null,
    currency: "USD",
  };
}
