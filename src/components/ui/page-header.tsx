import type { ReactNode } from "react";
import { Heart, Leaf, Sparkle } from "@/components/ui/doodles";

export function PageFrame({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-8 pt-4 sm:px-6 md:px-8 md:pt-8">
      {children}
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <header className="max-w-2xl">
      <p className="text-xs font-extrabold tracking-[0.16em] text-kitchi-red uppercase">{eyebrow}</p>
      <h1 className="mt-2 text-4xl text-kitchi-navy sm:text-5xl">{title}</h1>
      <div className="mt-2 flex items-center gap-1.5" aria-hidden="true">
        <Sparkle className="h-5 w-5 text-kitchi-orange" />
        <Heart className="h-4 w-4 text-kitchi-red" />
        <Leaf className="h-5 w-5 text-kitchi-green" />
      </div>
      <p className="mt-3 text-base text-kitchi-navy/75 sm:text-lg">{description}</p>
    </header>
  );
}
