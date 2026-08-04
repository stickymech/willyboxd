const STAR = "★";

const SIZE_CLASSES = {
  sm: "text-lg",
  md: "text-2xl",
  lg: "text-3xl",
} as const;

interface StarsProps {
  value: number;
  size?: "sm" | "md" | "lg";
  className?: string;
  label?: string;
}

export function Stars({ value, size = "md", className = "", label }: StarsProps) {
  return (
    <span
      className={`inline-flex items-center gap-px leading-none ${SIZE_CLASSES[size]} ${className}`}
      role="img"
      aria-label={label ?? `${value} out of 5 stars`}
      title={label ?? `${value} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((i) => {
        const fill = Math.max(0, Math.min(1, value - (i - 1)));
        return (
          <span key={i} className="relative inline-block text-text-subtle">
            {STAR}
            <span
              className="absolute inset-0 overflow-hidden text-accent"
              style={{ width: `${fill * 100}%` }}
            >
              {STAR}
            </span>
          </span>
        );
      })}
    </span>
  );
}
