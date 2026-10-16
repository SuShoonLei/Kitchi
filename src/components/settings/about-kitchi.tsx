"use client";

import { BrandLogo } from "@/components/brand/brand-logo";
import { Button, Card } from "@/components/ui/sticker";
import { MOTTO } from "@/lib/brand";
import { buildStamp } from "@/lib/build-info";
import { useLoadSampleData } from "@/lib/sample-data";
import { useIntroStore } from "@/store/use-intro-store";

export function AboutKitchi() {
  const openOnboarding = useIntroStore((state) => state.openOnboarding);
  const loadSample = useLoadSampleData();

  return (
    <Card className="mt-10 flex flex-col items-center px-6 py-8 text-center">
      <BrandLogo />
      <p className="mt-2 font-extrabold text-kitchi-red">{MOTTO}</p>
      <p className="mt-1 text-sm font-bold text-kitchi-navy/70">Build {buildStamp()}</p>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        <Button variant="steam" onClick={() => openOnboarding()}>
          Replay intro
        </Button>
        <Button variant="orange" onClick={() => loadSample()}>
          Load sample data
        </Button>
      </div>
    </Card>
  );
}
