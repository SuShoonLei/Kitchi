import { LOGO_SRC } from "@/lib/brand";

export function BrandLogo({
  compact = false,
  className = "",
}: {
  compact?: boolean;
  className?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={LOGO_SRC}
      alt="Kitchi"
      className={`brand-logo ${compact ? "brand-logo--compact" : ""} ${className}`}
    />
  );
}
