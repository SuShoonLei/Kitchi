import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "orange" | "steam" | "navy";

const BUTTON_TONES: Record<ButtonVariant, string> = {
  primary: "bg-kitchi-red text-kitchi-cream",
  orange: "bg-kitchi-orange text-kitchi-navy",
  steam: "bg-kitchi-steam text-kitchi-navy",
  navy: "bg-kitchi-navy text-kitchi-cream",
};

export function Button({
  variant = "primary",
  className = "",
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return (
    <button type={type} className={`sticker-press ${BUTTON_TONES[variant]} ${className}`} {...props} />
  );
}

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`sticker-card ${className}`}>{children}</div>;
}

export function Chip({
  pressed = false,
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { pressed?: boolean }) {
  const isTab = props.role === "tab";
  return (
    <button
      type="button"
      aria-pressed={isTab ? undefined : pressed}
      className={`sticker-press min-h-11 px-4 py-2 text-sm disabled:opacity-60 ${
        pressed ? "bg-kitchi-orange text-kitchi-navy" : "bg-kitchi-cream text-kitchi-navy"
      } ${className}`}
      {...props}
    />
  );
}

type BadgeTone = "green" | "yellow" | "red" | "quiet";

const BADGE_TONES: Record<BadgeTone, string> = {
  green: "bg-kitchi-green text-kitchi-cream",
  yellow: "bg-kitchi-yellow text-kitchi-navy",
  red: "bg-kitchi-red text-kitchi-cream",
  quiet: "bg-kitchi-steam text-kitchi-navy",
};

export function Badge({
  tone = "green",
  className = "",
  children,
}: {
  tone?: BadgeTone;
  className?: string;
  children: ReactNode;
}) {
  return <span className={`sticker-badge ${BADGE_TONES[tone]} ${className}`}>{children}</span>;
}
