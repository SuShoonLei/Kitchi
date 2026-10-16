"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { SplashScreen } from "@/components/brand/splash-screen";
import { OnboardingOverlay } from "@/components/intro/onboarding";
import { Button, Card } from "@/components/ui/sticker";
import { readOnboarded, readSplashSeen } from "@/lib/intro";
import { useIntroStore } from "@/store/use-intro-store";

function subscribeStorage(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  return () => window.removeEventListener("storage", onStoreChange);
}

function splashDone() {
  return readSplashSeen((key) => window.sessionStorage.getItem(key));
}

function onboardedFlag() {
  return readOnboarded((key) => window.localStorage.getItem(key));
}

export function IntroHost() {
  const splashAlreadyDone = useSyncExternalStore(subscribeStorage, splashDone, () => false);
  const onboarded = useSyncExternalStore(subscribeStorage, onboardedFlag, () => true);
  const forceOnboarding = useIntroStore((state) => state.forceOnboarding);
  const replayKey = useIntroStore((state) => state.replayKey);
  const toast = useIntroStore((state) => state.toast);
  const clearToast = useIntroStore((state) => state.clearToast);
  const clearForceOnboarding = useIntroStore((state) => state.clearForceOnboarding);

  const [splashClosed, setSplashClosed] = useState(false);
  const [dismissedKey, setDismissedKey] = useState<number | null>(null);

  const splashFinished = splashAlreadyDone || splashClosed;
  const wantsOnboarding = forceOnboarding || !onboarded;
  const onboardingOpen = splashFinished && wantsOnboarding && dismissedKey !== replayKey;

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(clearToast, 4200);
    return () => window.clearTimeout(timer);
  }, [clearToast, toast]);

  const onSplashFinished = useCallback(() => {
    setSplashClosed(true);
  }, []);

  const onOnboardingClose = useCallback(() => {
    setDismissedKey(replayKey);
    clearForceOnboarding();
  }, [clearForceOnboarding, replayKey]);

  return (
    <>
      {!splashFinished ? <SplashScreen onFinished={onSplashFinished} /> : null}
      <OnboardingOverlay
        key={replayKey}
        open={onboardingOpen}
        onClose={onOnboardingClose}
      />
      {toast ? (
        <div
          role="status"
          className="fixed bottom-24 left-1/2 z-[90] w-[min(100%-2rem,28rem)] -translate-x-1/2 md:bottom-6"
        >
          <Card className="flex items-center gap-3 bg-kitchi-cream px-4 py-3">
            <p className="min-w-0 flex-1 text-sm font-extrabold text-kitchi-navy">{toast}</p>
            <Button variant="steam" onClick={clearToast}>
              OK
            </Button>
          </Card>
        </div>
      ) : null}
    </>
  );
}
