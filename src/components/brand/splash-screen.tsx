"use client";

import { useLayoutEffect, useState, useSyncExternalStore } from "react";
import { Mascot } from "@/components/brand/mascot";
import { Wordmark } from "@/components/brand/wordmark";
import { Button } from "@/components/ui/sticker";
import { MOTTO } from "@/lib/brand";

const STORAGE_KEY = "kitchi-splash";

function subscribe(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  return () => window.removeEventListener("storage", onStoreChange);
}

function splashSeen() {
  return window.sessionStorage.getItem(STORAGE_KEY) === "1";
}

export function SplashScreen() {
  const alreadySeen = useSyncExternalStore(subscribe, splashSeen, () => false);
  const [dismissed, setDismissed] = useState(false);
  const visible = !alreadySeen && !dismissed;

  useLayoutEffect(() => {
    const content = document.getElementById("app-content");
    if (!visible) {
      content?.removeAttribute("inert");
      return;
    }
    content?.setAttribute("inert", "");
    const timer = window.setTimeout(() => {
      window.sessionStorage.setItem(STORAGE_KEY, "1");
      setDismissed(true);
    }, 1200);
    return () => {
      window.clearTimeout(timer);
      content?.removeAttribute("inert");
    };
  }, [visible]);

  function skip() {
    window.sessionStorage.setItem(STORAGE_KEY, "1");
    document.getElementById("app-content")?.removeAttribute("inert");
    setDismissed(true);
  }

  if (!visible) return null;

  return (
    <div className="splash" role="dialog" aria-label="Welcome to Kitchi">
      <div className="splash-lockup">
        <Mascot mood="cooking" size="xl" />
        <Wordmark className="splash-word text-5xl" />
        <p className="splash-motto">{MOTTO}</p>
      </div>
      <Button variant="steam" className="splash-skip" onClick={skip}>
        Skip
      </Button>
    </div>
  );
}
