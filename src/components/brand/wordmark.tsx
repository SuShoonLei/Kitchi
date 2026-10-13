import { WORDMARK } from "@/lib/brand";

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`wordmark ${className}`} aria-label="Kitchi">
      {WORDMARK.map((item, index) => (
        <span key={`${item.letter}-${index}`} style={{ color: item.color }} aria-hidden="true">
          {item.letter}
        </span>
      ))}
    </span>
  );
}
