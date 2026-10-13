import { LOGO_SRC } from "@/lib/brand";

export type MascotMood = "happy" | "cooking" | "sleepy" | "worried" | "celebrating";
export type MascotSize = "sm" | "md" | "lg" | "xl";

const SIZES: Record<MascotSize, number> = {
  sm: 56,
  md: 88,
  lg: 128,
  xl: 180,
};

export function Mascot({
  mood = "happy",
  size = "md",
  className = "",
}: {
  mood?: MascotMood;
  size?: MascotSize;
  className?: string;
}) {
  const px = SIZES[size];

  return (
    <span
      className={`mascot mascot--${mood} ${className}`}
      style={{ width: px, height: px }}
      data-mood={mood}
      aria-hidden="true"
    >
      <span className="mascot-rig">
        <span className="mascot-photo-frame">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={LOGO_SRC} alt="" className="mascot-photo" />
        </span>
        <span className="worry-wash" />
        <svg className="mascot-overlay" viewBox="0 0 100 100" fill="none">
          <g className="mascot-steam" stroke="#1D2B4F" strokeWidth="2.2" strokeLinecap="round">
            <path className="steam-puff" d="M38 22c-1-6 4-7 3-12" />
            <path className="steam-puff steam-puff--mid" d="M50 18c-1-6 5-8 4-13" />
            <path className="steam-puff steam-puff--late" d="M62 22c2-6-3-8 0-13" />
          </g>
          <g className="eyes-shut" stroke="#1D2B4F" strokeWidth="2.4" strokeLinecap="round">
            <ellipse cx="33.5" cy="56" rx="8" ry="5.5" fill="#F7931E" stroke="none" />
            <ellipse cx="66.5" cy="56" rx="8" ry="5.5" fill="#F7931E" stroke="none" />
            <path d="M28 56c3-3 8-3 11 0" />
            <path d="M61 56c3-3 8-3 11 0" />
          </g>
          <path className="sweat" d="M74 42c2.4 3.4 2.4 6 0 8.4-2.4-2.4-2.4-5 0-8.4z" fill="#CFE9F2" stroke="#1D2B4F" strokeWidth="1.4" />
          <g className="zzz" fill="#2B7BBF" stroke="#1D2B4F" strokeWidth="0.8" strokeLinejoin="round">
            <path d="M74 16h8l-8 6h8" />
            <path d="M84 12h5l-5 4h5" />
          </g>
          <g className="confetti-bits">
            <circle className="confetti-bit" style={{ ["--dx" as string]: "-10px", ["--dy" as string]: "-14px" }} cx="16" cy="28" r="2.4" fill="#F7931E" />
            <circle className="confetti-bit" style={{ ["--dx" as string]: "12px", ["--dy" as string]: "-12px" }} cx="84" cy="24" r="2.2" fill="#E3342F" />
            <circle className="confetti-bit" style={{ ["--dx" as string]: "-12px", ["--dy" as string]: "6px" }} cx="12" cy="62" r="2" fill="#2B7BBF" />
            <circle className="confetti-bit" style={{ ["--dx" as string]: "12px", ["--dy" as string]: "4px" }} cx="88" cy="58" r="2.2" fill="#6AB04C" />
            <path className="confetti-bit" style={{ ["--dx" as string]: "4px", ["--dy" as string]: "-16px" }} d="M50 8l1 2.6 2.6 1-2.6 1L50 16l-1-2.6-2.6-1 2.6-1z" fill="#F9C80E" />
          </g>
        </svg>
      </span>
    </span>
  );
}
