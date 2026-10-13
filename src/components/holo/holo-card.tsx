"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
} from "react";

const MAX_TILT = 14;
const TILT_EASE = 0.12;
const FLIP_EASE = 0.16;

type Sample = {
  id: number;
  x: number;
  y: number;
  moved: boolean;
  scrolling: boolean;
  type: string;
};

type MotionState = {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  pointerX: number;
  pointerY: number;
  flip: number;
  flipTarget: number;
  raf: number;
  reduced: boolean;
  kick: () => void;
};

type HoloCardProps = {
  front: ReactNode;
  back: ReactNode;
  label: string;
  current?: boolean;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function drawFoil(canvas: HTMLCanvasElement, px: number, py: number) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return false;

  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const width = Math.max(1, Math.round(rect.width * dpr));
  const height = Math.max(1, Math.round(rect.height * dpr));
  if (width < 2 || height < 2) return false;

  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }

  ctx.clearRect(0, 0, width, height);

  const cx = width * (0.5 + px * 0.32);
  const cy = height * (0.42 + py * 0.32);
  const length = Math.hypot(width, height);
  const angle = Math.atan2(py + 0.2, px + 0.15);
  const gradient = ctx.createLinearGradient(
    cx - Math.cos(angle) * length,
    cy - Math.sin(angle) * length,
    cx + Math.cos(angle) * length,
    cy + Math.sin(angle) * length,
  );

  gradient.addColorStop(0, "rgba(227, 52, 47, 0)");
  gradient.addColorStop(0.16, "rgba(247, 147, 30, 0.88)");
  gradient.addColorStop(0.34, "rgba(227, 52, 47, 0.72)");
  gradient.addColorStop(0.5, "rgba(43, 123, 191, 0.7)");
  gradient.addColorStop(0.66, "rgba(106, 176, 76, 0.75)");
  gradient.addColorStop(0.82, "rgba(249, 200, 14, 0.9)");
  gradient.addColorStop(1, "rgba(247, 147, 30, 0)");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  const shine = ctx.createRadialGradient(cx, cy, width * 0.02, cx, cy, width * 0.58);
  shine.addColorStop(0, "rgba(255, 255, 255, 0.9)");
  shine.addColorStop(0.3, "rgba(249, 200, 14, 0.32)");
  shine.addColorStop(1, "rgba(255, 255, 255, 0)");
  ctx.fillStyle = shine;
  ctx.fillRect(0, 0, width, height);

  ctx.save();
  ctx.globalAlpha = 0.15;
  ctx.strokeStyle = "rgba(255, 255, 255, 0.95)";
  ctx.lineWidth = dpr;
  for (let offset = -height; offset < width + height; offset += 8 * dpr) {
    ctx.beginPath();
    ctx.moveTo(offset, 0);
    ctx.lineTo(offset + height * 0.42, height);
    ctx.stroke();
  }
  ctx.restore();
  return true;
}

export function HoloCard({ front, back, label, current = false }: HoloCardProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const rotorRef = useRef<HTMLDivElement>(null);
  const shadowRef = useRef<HTMLDivElement>(null);
  const frontCanvasRef = useRef<HTMLCanvasElement>(null);
  const backCanvasRef = useRef<HTMLCanvasElement>(null);
  const sampleRef = useRef<Sample | null>(null);
  const suppressClickRef = useRef(false);
  const motionRef = useRef<MotionState>({
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0,
    pointerX: 0,
    pointerY: 0,
    flip: 0,
    flipTarget: 0,
    raf: 0,
    reduced: false,
    kick: () => {},
  });
  const [flipped, setFlipped] = useState(false);
  const [ready, setReady] = useState(false);
  const flippedRef = useRef(false);

  useEffect(() => {
    const motion = motionRef.current;
    const rotor = rotorRef.current;
    const shadow = shadowRef.current;
    const frontCanvas = frontCanvasRef.current;
    const backCanvas = backCanvasRef.current;
    const root = rootRef.current;
    if (!rotor || !shadow || !frontCanvas || !backCanvas || !root) return;

    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    motion.reduced = media.matches;

    const paint = () => {
      const px = motion.reduced ? 0 : motion.pointerX;
      const py = motion.reduced ? 0 : motion.pointerY;
      const drew = drawFoil(frontCanvas, px, py) || drawFoil(backCanvas, px, py);
      if (drew) setReady(true);
    };

    // Tilt and the Y flip share one eased transform. The shadow travels the other way.
    const tick = () => {
      const tiltEase = motion.reduced ? 1 : TILT_EASE;
      const flipEase = motion.reduced ? 0.34 : FLIP_EASE;
      motion.x += (motion.targetX - motion.x) * tiltEase;
      motion.y += (motion.targetY - motion.y) * tiltEase;
      motion.flip += (motion.flipTarget - motion.flip) * flipEase;

      rotor.style.transform = `rotateX(${motion.x.toFixed(3)}deg) rotateY(${(motion.y + motion.flip).toFixed(3)}deg)`;
      shadow.style.transform = `translate3d(${(-motion.y * 0.85).toFixed(2)}px, ${(8 + Math.abs(motion.x) * 0.4).toFixed(2)}px, 0)`;

      if (!motion.reduced) paint();

      const settled =
        Math.abs(motion.targetX - motion.x) < 0.05 &&
        Math.abs(motion.targetY - motion.y) < 0.05 &&
        Math.abs(motion.flipTarget - motion.flip) < 0.05;

      if (settled) {
        motion.x = motion.targetX;
        motion.y = motion.targetY;
        motion.flip = motion.flipTarget;
        rotor.style.transform = `rotateX(${motion.x}deg) rotateY(${motion.y + motion.flip}deg)`;
        shadow.style.transform = `translate3d(${-motion.y * 0.85}px, ${8 + Math.abs(motion.x) * 0.4}px, 0)`;
        motion.raf = 0;
        return;
      }

      motion.raf = window.requestAnimationFrame(tick);
    };

    motion.kick = () => {
      if (motion.raf) return;
      motion.raf = window.requestAnimationFrame(tick);
    };

    paint();

    const observer = new ResizeObserver(() => paint());
    observer.observe(root);

    const onMotionPreference = () => {
      motion.reduced = media.matches;
      if (media.matches) {
        motion.targetX = 0;
        motion.targetY = 0;
        motion.pointerX = 0;
        motion.pointerY = 0;
        paint();
        motion.kick();
      }
    };
    media.addEventListener("change", onMotionPreference);

    const onOrientation = (event: DeviceOrientationEvent) => {
      if (motion.reduced || sampleRef.current) return;
      if (event.gamma == null || event.beta == null) return;
      motion.pointerX = clamp(event.gamma / 32, -1, 1);
      motion.pointerY = clamp((event.beta - 45) / 32, -1, 1);
      motion.targetY = motion.pointerX * MAX_TILT;
      motion.targetX = -motion.pointerY * MAX_TILT;
      motion.kick();
    };
    window.addEventListener("deviceorientation", onOrientation);

    return () => {
      observer.disconnect();
      media.removeEventListener("change", onMotionPreference);
      window.removeEventListener("deviceorientation", onOrientation);
      if (motion.raf) window.cancelAnimationFrame(motion.raf);
      motion.raf = 0;
      motion.kick = () => {};
    };
  }, []);

  function tiltTo(clientX: number, clientY: number) {
    const root = rootRef.current;
    const motion = motionRef.current;
    if (!root || motion.reduced) return;
    const rect = root.getBoundingClientRect();
    const nx = clamp(((clientX - rect.left) / rect.width) * 2 - 1, -1, 1);
    const ny = clamp(((clientY - rect.top) / rect.height) * 2 - 1, -1, 1);
    motion.pointerX = nx;
    motion.pointerY = ny;
    motion.targetY = nx * MAX_TILT;
    motion.targetX = -ny * MAX_TILT;
    motion.kick();
  }

  function rest() {
    const motion = motionRef.current;
    motion.targetX = 0;
    motion.targetY = 0;
    motion.pointerX = 0;
    motion.pointerY = 0;
    motion.kick();
  }

  function toggleFlip() {
    const next = !flippedRef.current;
    flippedRef.current = next;
    motionRef.current.flipTarget = next ? 180 : 0;
    motionRef.current.kick();
    setFlipped(next);
  }

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if ((event.target as HTMLElement).closest("a, button")) return;
    sampleRef.current = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      moved: false,
      scrolling: false,
      type: event.pointerType,
    };
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    if (motionRef.current.reduced) return;
    const sample = sampleRef.current;

    if (event.pointerType === "touch") {
      if (!sample || sample.id !== event.pointerId || sample.scrolling) return;
      const dx = event.clientX - sample.x;
      const dy = event.clientY - sample.y;
      if (!sample.moved && Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 10) {
        sample.scrolling = true;
        return;
      }
      if (Math.hypot(dx, dy) > 8) sample.moved = true;
      motionRef.current.pointerX = clamp(dx / 90, -1, 1);
      motionRef.current.pointerY = clamp(dy / 90, -1, 1);
      motionRef.current.targetY = motionRef.current.pointerX * MAX_TILT;
      motionRef.current.targetX = -motionRef.current.pointerY * MAX_TILT;
      motionRef.current.kick();
      return;
    }

    if (sample && sample.id === event.pointerId) {
      const dx = event.clientX - sample.x;
      const dy = event.clientY - sample.y;
      if (Math.hypot(dx, dy) > 8) sample.moved = true;
    }

    tiltTo(event.clientX, event.clientY);
  }

  function onPointerLeave(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType === "touch") return;
    rest();
  }

  function onPointerUp(event: PointerEvent<HTMLDivElement>) {
    const sample = sampleRef.current;
    if (!sample || sample.id !== event.pointerId) return;
    if (sample.moved || sample.scrolling) suppressClickRef.current = true;
    sampleRef.current = null;
    if (sample.type === "touch") rest();
  }

  function onClick(event: MouseEvent<HTMLDivElement>) {
    if ((event.target as HTMLElement).closest("a, button")) return;
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }
    toggleFlip();
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.target !== event.currentTarget) return;
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    toggleFlip();
  }

  return (
    <div
      ref={rootRef}
      className="holo-card"
      data-flippable=""
      data-ready={ready ? "" : undefined}
      data-current={current ? "" : undefined}
      tabIndex={0}
      role="group"
      aria-roledescription="flippable folder"
      aria-label={label}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onClick={onClick}
      onKeyDown={onKeyDown}
      style={{ "--hc-w": "min(100%, 22.5rem)" } as CSSProperties}
    >
      <div ref={shadowRef} className="holo-card__shadow" />
      <div ref={rotorRef} className="holo-card__rotor">
        <div className="holo-card__face holo-card__face--front" inert={flipped}>
          <canvas ref={frontCanvasRef} aria-hidden="true" />
          <div className="holo-card__content">{front}</div>
        </div>
        <div className="holo-card__face holo-card__face--back" inert={!flipped}>
          <canvas ref={backCanvasRef} aria-hidden="true" />
          <div className="holo-card__content">{back}</div>
        </div>
      </div>
    </div>
  );
}
