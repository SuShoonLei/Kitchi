import { describe, expect, it } from "vitest";
import {
  ONBOARDED_KEY,
  SPLASH_SESSION_KEY,
  advanceIntroStep,
  buildOnboardingSettings,
  parseBudgetInput,
  readOnboarded,
  readSplashSeen,
  shouldMarkOnboarded,
  shouldSaveOnboarding,
  writeOnboarded,
  writeSplashSeen,
} from "@/lib/intro";

function memoryStorage() {
  const map = new Map<string, string>();
  return {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => {
      map.set(key, value);
    },
    removeItem: (key: string) => {
      map.delete(key);
    },
    map,
  };
}

describe("splash gating", () => {
  it("shows once per session", () => {
    const storage = memoryStorage();
    expect(readSplashSeen(storage.getItem)).toBe(false);
    writeSplashSeen(storage.setItem);
    expect(storage.map.get(SPLASH_SESSION_KEY)).toBe("1");
    expect(readSplashSeen(storage.getItem)).toBe(true);
  });
});

describe("onboarding gating", () => {
  it("shows only without the onboarded flag", () => {
    const storage = memoryStorage();
    expect(readOnboarded(storage.getItem)).toBe(false);
    writeOnboarded(storage.setItem);
    expect(storage.map.get(ONBOARDED_KEY)).toBe("1");
    expect(readOnboarded(storage.getItem)).toBe(true);
  });

  it("Skip on step 3 goes to step 4", () => {
    expect(advanceIntroStep(2, "skipToSetup")).toBe(3);
    expect(advanceIntroStep(0, "skipToSetup")).toBe(3);
    expect(advanceIntroStep(1, "next")).toBe(2);
    expect(advanceIntroStep(3, "back")).toBe(2);
  });

  it("Skip for now saves nothing", () => {
    expect(shouldSaveOnboarding("skipForNow")).toBe(false);
    expect(shouldSaveOnboarding("finish")).toBe(true);
  });

  it("finish builds the settings payload with chosen cuisines and budget", () => {
    expect(
      buildOnboardingSettings({
        cuisines: ["Burmese", "Thai"],
        budget: 40.5,
        currency: "USD",
      }),
    ).toEqual({
      preferredCuisines: ["Burmese", "Thai"],
      eatingOutBudgetWeekly: 40.5,
      currency: "USD",
    });
  });

  it("sets the onboarded flag after both success and failure", () => {
    expect(shouldMarkOnboarded("finish", true)).toBe(true);
    expect(shouldMarkOnboarded("finish", false)).toBe(true);
    expect(shouldMarkOnboarded("skipForNow", null)).toBe(true);
  });

  it("accepts an empty or valid budget", () => {
    expect(parseBudgetInput("")).toEqual({ ok: true, value: null });
    expect(parseBudgetInput("12.50")).toEqual({ ok: true, value: 12.5 });
    expect(parseBudgetInput("-1").ok).toBe(false);
    expect(parseBudgetInput("1.234").ok).toBe(false);
  });
});
