"use client";

import { Mascot, type MascotMood } from "@/components/brand/mascot";
import { Bubble, Heart, Sparkle } from "@/components/ui/doodles";
import { getExpiryStatus } from "@/lib/expiry";
import { MOTTO } from "@/lib/brand";
import { useFridgeStore, useStoreReady } from "@/store/use-fridge-store";

function greeting(urgent: number, soon: number) {
  const hour = new Date().getHours();
  const hello = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  if (urgent === 1) return { mood: "worried" as const, line: `${hello}! 1 ingredient needs love today.` };
  if (urgent > 1) return { mood: "worried" as const, line: `${hello}! ${urgent} ingredients need love today.` };
  if (soon === 1) return { mood: "happy" as const, line: `${hello}! 1 ingredient is calling.` };
  if (soon > 0) return { mood: "happy" as const, line: `${hello}! ${soon} ingredients are calling.` };
  return { mood: "celebrating" as const, line: `${hello}! Nothing wasted today. Nice one!` };
}

export function HomeHero() {
  const ready = useStoreReady();
  const ingredients = useFridgeStore((state) => state.ingredients);
  const urgent = ready ? ingredients.filter((item) => getExpiryStatus(item.expiresAt) === "urgent").length : 0;
  const soon = ready ? ingredients.filter((item) => getExpiryStatus(item.expiresAt) === "soon").length : 0;
  const message = ready ? greeting(urgent, soon) : { mood: "cooking" as MascotMood, line: "Let's cook something tasty." };

  return (
    <section className="sticker-card relative overflow-hidden bg-kitchi-steam/70 px-4 py-5 sm:px-6">
      <div className="pointer-events-none absolute top-3 right-4 flex gap-2 text-kitchi-orange" aria-hidden="true">
        <Sparkle className="h-5 w-5" />
        <Heart className="h-4 w-4 text-kitchi-red" />
        <Bubble className="h-4 w-4 text-kitchi-blue" />
      </div>
      <div className="flex items-center gap-4 pr-8">
        <Mascot mood={message.mood} size="lg" className="shrink-0" />
        <p className="min-w-0 font-display text-3xl leading-tight text-kitchi-navy sm:text-4xl">{message.line}</p>
      </div>
      <p className="mt-3 text-sm font-extrabold tracking-wide text-kitchi-red">{MOTTO}</p>
    </section>
  );
}
