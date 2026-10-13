import type { SVGProps } from "react";
import type { NavIconName } from "@/components/shell/nav";

function Icon({ className, children }: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden="true" className={className}>
      {children}
    </svg>
  );
}

export function NavIcon({ name, className }: { name: NavIconName; className?: string }) {
  const stroke = {
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  if (name === "home") {
    return (
      <Icon className={className}>
        <path d="M6 15 16 7l10 8" {...stroke} />
        <path d="M9 14.2V25h14V14.2" {...stroke} />
        <path d="M14 25v-6h4v6" {...stroke} />
      </Icon>
    );
  }

  if (name === "pantry") {
    return (
      <Icon className={className}>
        <path d="M11 8h10v3H11z" {...stroke} />
        <path d="M10 11h12l-1.2 14.2a3 3 0 0 1-3 2.8h-3.6a3 3 0 0 1-3-2.8L10 11z" {...stroke} />
      </Icon>
    );
  }

  if (name === "add") {
    return (
      <Icon className={className}>
        <path d="M16 8v16M8 16h16" {...stroke} />
      </Icon>
    );
  }

  if (name === "recipes") {
    return (
      <Icon className={className}>
        <path d="M7 14h18c-1 7-4.5 11-9 11S8 21 7 14z" {...stroke} />
        <path d="M12 14c.4-4 2-6 4-6" {...stroke} />
      </Icon>
    );
  }

  if (name === "grocery") {
    return (
      <Icon className={className}>
        <path d="M8 13h16l-1.5 11h-13z" {...stroke} />
        <path d="M11 13c0-3 2-5 5-5s5 2 5 5" {...stroke} />
      </Icon>
    );
  }

  if (name === "spending") {
    return (
      <Icon className={className}>
        <path d="M10 7h10l4 4v14H10z" {...stroke} />
        <path d="M13 16h8M13 20h6" {...stroke} />
      </Icon>
    );
  }

  return (
    <Icon className={className}>
      <path d="M6 11h20M6 16h20M6 21h20" {...stroke} />
      <circle cx="12" cy="11" r="2" fill="currentColor" />
      <circle cx="20" cy="16" r="2" fill="currentColor" />
      <circle cx="14" cy="21" r="2" fill="currentColor" />
    </Icon>
  );
}
