import { Mascot, type MascotMood } from "@/components/brand/mascot";
import { Card } from "@/components/ui/sticker";

export function EmptyState({
  title,
  description,
  mood = "sleepy",
}: {
  title: string;
  description: string;
  mood?: MascotMood;
}) {
  return (
    <Card className="mt-8 px-6 py-10 text-center">
      <Mascot mood={mood} size="lg" className="mx-auto" />
      <h2 className="mt-3 text-2xl text-kitchi-navy">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-kitchi-navy/75">{description}</p>
    </Card>
  );
}
