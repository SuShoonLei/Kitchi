import { CUISINES, INGREDIENT_CATEGORIES, type Cuisine, type IngredientCategory } from "@/lib/types";

export function apiHeaders(deviceId: string, timeZone: string): Record<string, string> {
  return {
    Accept: "application/json",
    "X-Device-Id": deviceId,
    "X-Timezone": timeZone,
  };
}

export function toWireCategory(value: string): IngredientCategory {
  const match = INGREDIENT_CATEGORIES.find((category) => category === value.trim().toLowerCase());
  if (!match) throw new Error("Unknown category");
  return match;
}

export function toWireCuisine(value: string): Cuisine {
  const match = CUISINES.find((cuisine) => cuisine.toLowerCase() === value.trim().toLowerCase());
  if (!match) throw new Error("Unknown cuisine");
  return match;
}

export class ApiError extends Error {
  readonly status: number;
  readonly fieldErrors: Record<string, string>;

  constructor(status: number, message: string, fieldErrors: Record<string, string> = {}) {
    super(message);
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

export function unreachableMessage(error: unknown): string {
  if (isApiError(error) && error.status === 0) return error.message;
  if (error instanceof TypeError) return "Kitchi can't reach the kitchen right now.";
  if (error instanceof Error && error.message) return error.message;
  return "Something went wrong.";
}
