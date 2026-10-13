import type { SVGProps } from "react";

type DoodleProps = SVGProps<SVGSVGElement>;

function base(props: DoodleProps): SVGProps<SVGSVGElement> {
  return {
    viewBox: "0 0 32 32",
    fill: "none",
    "aria-hidden": true,
    ...props,
  };
}

export function Sparkle(props: DoodleProps) {
  return (
    <svg {...base(props)}>
      <path
        d="M16 3l2.2 7.2L25 12.4l-6.8 2.2L16 22l-2.2-7.4L7 12.4l6.8-2.2z"
        fill="currentColor"
        stroke="#1D2B4F"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Heart(props: DoodleProps) {
  return (
    <svg {...base(props)}>
      <path
        d="M16 26s-9-5.4-9-11.2C7 11 9.4 8.6 12.4 8.6c1.8 0 3 1 3.6 2.2.6-1.2 1.8-2.2 3.6-2.2 3 0 5.4 2.4 5.4 6.2C25 20.6 16 26 16 26z"
        fill="currentColor"
        stroke="#1D2B4F"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Leaf(props: DoodleProps) {
  return (
    <svg {...base(props)}>
      <path
        d="M8 22c8-1 14-8 16-16-8 1-15 7-16 16z"
        fill="currentColor"
        stroke="#1D2B4F"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M11 19c3-3 6-5 9-7" stroke="#1D2B4F" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function Bubble(props: DoodleProps) {
  return (
    <svg {...base(props)}>
      <circle cx="16" cy="16" r="9" fill="currentColor" stroke="#1D2B4F" strokeWidth="1.6" />
      <circle cx="13" cy="13" r="2" fill="#FFF8EC" />
    </svg>
  );
}

export function SteamSwirl(props: DoodleProps) {
  return (
    <svg {...base(props)}>
      <path
        d="M12 26c-2-6 5-7 3-13M20 24c-1-6 6-8 4-14"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  );
}
