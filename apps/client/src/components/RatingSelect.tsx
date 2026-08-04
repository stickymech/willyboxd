import { useState } from "react";

const STAR = "★";

interface RatingSelectProps {
  value?: number;
  onChange?: (rating: number | undefined) => void;
  size?: "sm" | "md" | "lg";
}

const SIZE_CLASSES = {
  sm: "text-lg",
  md: "text-2xl",
  lg: "text-3xl",
} as const;

export function starValueFromClick(starIndex: number, offsetX: number, width: number): number {
  return offsetX < width / 2 ? starIndex - 0.5 : starIndex;
}

export function RatingSelect({ value, onChange, size = "md" }: RatingSelectProps) {
  const [preview, setPreview] = useState<number | undefined>(undefined);
  const active = preview ?? value;

  return (
    <div
      className="inline-flex items-center gap-2"
      role="group"
      aria-label="Rating"
      onMouseLeave={() => setPreview(undefined)}
    >
      <div className={`inline-flex items-center gap-px ${SIZE_CLASSES[size]}`}>
        {[1, 2, 3, 4, 5].map((i) => {
          const fill = active === undefined ? 0 : Math.max(0, Math.min(1, active - (i - 1)));
          return (
            <button
              key={i}
              type="button"
              aria-label={`Rate ${i - 0.5} or ${i} stars`}
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                setPreview(starValueFromClick(i, e.clientX - rect.left, rect.width));
              }}
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const next = starValueFromClick(i, e.clientX - rect.left, rect.width);
                onChange?.(value === next ? undefined : next);
              }}
              className="relative inline-block leading-none text-text-subtle transition-colors"
            >
              <span className="relative inline-block">
                {STAR}
                <span
                  className="absolute inset-0 overflow-hidden text-accent"
                  style={{ width: `${fill * 100}%` }}
                >
                  {STAR}
                </span>
              </span>
            </button>
          );
        })}
      </div>
      {value !== undefined && (
        <button
          type="button"
          onClick={() => onChange?.(undefined)}
          className="text-xs text-text-subtle hover:text-text transition-colors"
        >
          Clear
        </button>
      )}
    </div>
  );
}
