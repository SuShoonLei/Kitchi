"use client";

import { BrandLogo } from "@/components/brand/brand-logo";
import { Button, Card } from "@/components/ui/sticker";
import { APP_VERSION, MOTTO } from "@/lib/brand";
import { useIntroStore } from "@/store/use-intro-store";

export function AboutKitchi() {
  const openOnboarding = useIntroStore((state) => state.openOnboarding);

  return (
    <Card className="mt-10 flex flex-col items-center px-6 py-8 text-center">
      <BrandLogo />
      <p className="mt-2 font-extrabold text-kitchi-red">{MOTTO}</p>
      <p className="mt-1 text-sm font-bold text-kitchi-navy/70">Version {APP_VERSION}</p>
      <Button
        variant="steam"
        className="mt-4"
        onClick={() => openOnboarding()}
      >
        Replay intro
      </Button>
    </Card>
  );
}
