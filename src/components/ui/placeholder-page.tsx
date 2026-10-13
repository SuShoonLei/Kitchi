import type { ReactNode } from "react";
import type { MascotMood } from "@/components/brand/mascot";
import { EmptyState } from "@/components/ui/empty-state";
import { PageFrame, PageHeader } from "@/components/ui/page-header";

export function PlaceholderPage({
  eyebrow,
  title,
  description,
  emptyTitle,
  emptyDescription,
  mood = "sleepy",
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  emptyTitle: string;
  emptyDescription: string;
  mood?: MascotMood;
  children?: ReactNode;
}) {
  return (
    <PageFrame>
      <PageHeader eyebrow={eyebrow} title={title} description={description} />
      {children}
      <EmptyState title={emptyTitle} description={emptyDescription} mood={mood} />
    </PageFrame>
  );
}
