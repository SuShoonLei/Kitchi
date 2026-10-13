"use client";

import { HomeHero } from "@/components/home/home-hero";
import { UseFirstStrip } from "@/components/home/use-first-strip";
import { WeekGrid } from "@/components/home/week-grid";
import { PageFrame } from "@/components/ui/page-header";

export function HomeView() {
  return (
    <PageFrame>
      <HomeHero />
      <UseFirstStrip />
      <WeekGrid />
    </PageFrame>
  );
}
