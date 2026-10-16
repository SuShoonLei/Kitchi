import type { Cuisine } from "@/lib/types";

export const SPLASH_SESSION_KEY = "kitchi:splash";
export const ONBOARDED_KEY = "kitchi:onboarded";

export const INTRO_STEPS = 4;

export type IntroAction = "next" | "back" | "skipToSetup";

export type StorageReader = (key: string) => string | null;
export type StorageWriter = (key: string, value: string) => void;
export type StorageRemover = (key: string) => void;

export function readSplashSeen(getItem: StorageReader): boolean {
  return getItem(SPLASH_SESSION_KEY) === "1";
}

export function writeSplashSeen(setItem: StorageWriter): void {
  setItem(SPLASH_SESSION_KEY, "1");
}

export function readOnboarded(getItem: StorageReader): boolean {
  return getItem(ONBOARDED_KEY) === "1";
}

export function writeOnboarded(setItem: StorageWriter): void {
  setItem(ONBOARDED_KEY, "1");
}

export function clearOnboarded(removeItem: StorageRemover): void {
  removeItem(ONBOARDED_KEY);
}

/** 0-based step index. Skip from steps 0–2 jumps to the setup step (3). */
export function advanceIntroStep(step: number, action: IntroAction): number {
  const current = Math.max(0, Math.min(INTRO_STEPS - 1, step));
  if (action === "skipToSetup") return INTRO_STEPS - 1;
  if (action === "back") return Math.max(0, current - 1);
  return Math.min(INTRO_STEPS - 1, current + 1);
}

export function parseBudgetInput(raw: string): { ok: true; value: number | null } | { ok: false; error: string } {
  const trimmed = raw.trim();
  if (trimmed === "") return { ok: true, value: null };
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) {
    return { ok: false, error: "Use a number with up to 2 decimal places." };
  }
  const value = Number(trimmed);
  if (!Number.isFinite(value) || value < 0) {
    return { ok: false, error: "Budget must be empty or zero or more." };
  }
  return { ok: true, value };
}

export type FinishIntent = "finish" | "skipForNow";

export function shouldSaveOnboarding(intent: FinishIntent): boolean {
  return intent === "finish";
}

/** Onboarding flag is always set when the overlay closes, success or failure. */
export function shouldMarkOnboarded(intent: FinishIntent, saveSucceeded: boolean | null): boolean {
  return intent === "skipForNow" || saveSucceeded === true || saveSucceeded === false;
}

export function buildOnboardingSettings(input: {
  cuisines: Cuisine[];
  budget: number | null;
  currency: string;
}) {
  return {
    preferredCuisines: input.cuisines,
    eatingOutBudgetWeekly: input.budget,
    currency: input.currency,
  };
}
