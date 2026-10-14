"use client";

import type { ReactNode } from "react";
import { Mascot, type MascotMood } from "@/components/brand/mascot";
import { Button, Card } from "@/components/ui/sticker";
import { unreachableMessage } from "@/lib/wire";

export function SkeletonGrid({ count = 3 }: { count?: number }) {
  return (
    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
      <p className="sr-only">Loading.</p>
      {Array.from({ length: count }, (_, index) => (
        <div key={index} aria-hidden="true" className="h-28 animate-pulse rounded-[18px] bg-kitchi-steam" />
      ))}
    </div>
  );
}

export function ErrorState({
  error,
  onRetry,
  mood = "worried",
}: {
  error: unknown;
  onRetry?: () => void;
  mood?: MascotMood;
}) {
  return (
    <Card className="mt-6 px-6 py-8 text-center">
      <Mascot mood={mood} size="lg" className="mx-auto" />
      <h2 className="mt-3 text-2xl text-kitchi-navy">The pot hit a snag</h2>
      <p className="mx-auto mt-2 max-w-md text-kitchi-navy/75">{unreachableMessage(error)}</p>
      {onRetry ? (
        <Button className="mt-4" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </Card>
  );
}

export function QueryGate({
  isLoading,
  error,
  onRetry,
  skeleton,
  children,
}: {
  isLoading: boolean;
  error: unknown;
  onRetry?: () => void;
  skeleton?: ReactNode;
  children: ReactNode;
}) {
  if (isLoading) return skeleton ?? <SkeletonGrid />;
  if (error) return <ErrorState error={error} onRetry={onRetry} />;
  return children;
}
