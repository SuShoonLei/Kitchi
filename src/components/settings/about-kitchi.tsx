import { BrandLogo } from "@/components/brand/brand-logo";
import { Card } from "@/components/ui/sticker";
import { APP_VERSION, MOTTO } from "@/lib/brand";

export function AboutKitchi() {
  return (
    <Card className="mt-10 flex flex-col items-center px-6 py-8 text-center">
      <BrandLogo />
      <p className="mt-2 font-extrabold text-kitchi-red">{MOTTO}</p>
      <p className="mt-1 text-sm font-bold text-kitchi-navy/70">Version {APP_VERSION}</p>
    </Card>
  );
}
