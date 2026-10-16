"use client";

import { create } from "zustand";

type IntroUiState = {
  forceOnboarding: boolean;
  replayKey: number;
  toast: string | null;
  openOnboarding: () => void;
  clearForceOnboarding: () => void;
  showToast: (message: string) => void;
  clearToast: () => void;
};

export const useIntroStore = create<IntroUiState>((set) => ({
  forceOnboarding: false,
  replayKey: 0,
  toast: null,
  openOnboarding: () =>
    set((state) => ({
      forceOnboarding: true,
      replayKey: state.replayKey + 1,
    })),
  clearForceOnboarding: () => set({ forceOnboarding: false }),
  showToast: (message) => set({ toast: message }),
  clearToast: () => set({ toast: null }),
}));
