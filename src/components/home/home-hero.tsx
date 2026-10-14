"use client";

import { Mascot, type MascotMood } from "@/components/brand/mascot";
import { Bubble, Heart, Sparkle } from "@/components/ui/doodles";
import { ErrorState } from "@/components/ui/query-state";
import { getExpiryStatus } from "@/lib/expiry";
import { formatMoney } from "@/lib/format";
import { MOTTO } from "@/lib/brand";
import { useExpiring, useSavings, useSettings } from "@/lib/use-journal";

function greeting(urgent: number, soon: number, moneySaved: number, currency: string) {
  const hour = new Date().getHours();
  const hello = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  if (urgent === 1) return { mood: "worried" as const, line: `${hello}! 1 ingredient needs love today.` };
  if (urgent > 1) return { mood: "worried" as const, line: `${hello}! ${urgent} ingredients need love today.` };
  if (soon === 1) return { mood: "happy" as const, line: `${hello}! 1 ingredient is calling.` };
  if (soon > 0) return { mood: "happy" as const, line: `${hello}! ${soon} ingredients are calling.` };
  if (moneySaved > 0) {
    return { mood: "celebrating" as const, line: `${hello}! ${formatMoney(moneySaved, currency)} rescued so far.` };
  }
  return { mood: "celebrating" as const, line: `${hello}! Nothing wasted today. Nice one!` };
}

export function HomeHero() {
  const expiring = useExpiring();
  const savings = useSavings();
  const settings = useSettings();
  const loading = expiring.isLoading || savings.isLoading;
  const urgent = loading ? 0 : (expiring.data ?? []).filter((item) => getExpiryStatus(item.expiresAt) === "urgent").length;
  const soon = loading ? 0 : (expiring.data ?? []).filter((item) => getExpiryStatus(item.expiresAt) === "soon").length;
  const message = loading
    ? { mood: "cooking" as MascotMood, line: "Let's cook something tasty." }
    : greeting(urgent, soon, savings.data?.moneySaved ?? 0, settings.data?.currency ?? "USD");

  if (expiring.error || savings.error) {
    return <ErrorState error={expiring.error ?? savings.error} onRetry={() => { void expiring.refetch(); void savings.refetch(); }} />;
  }

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
