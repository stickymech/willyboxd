import { RATING_OPTIONS, ratingLabel } from "@willyboxd/shared";

interface RatingSelectProps {
  value?: number;
  onChange?: (rating: number | undefined) => void;
  size?: "sm" | "md" | "lg";
}

export function RatingSelect({ value, onChange, size = "md" }: RatingSelectProps) {
  const sizeClasses = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-3xl",
  };

  return (
    <div className="flex items-center gap-1">
      {RATING_OPTIONS.map((r) => (
        <button
          key={r}
          type="button"
          onClick={() => onChange?.(value === r ? undefined : r)}
          className={`rating-star ${value === r ? "text-accent" : "text-text-subtle hover:text-accent"} transition-colors ${sizeClasses[size]}`}
        >
          {ratingLabel(r)}
        </button>
      ))}
      {value !== undefined && (
        <button
          type="button"
          onClick={() => onChange?.(undefined)}
          className={`rating-star text-text-subtle ${sizeClasses[size]}`}
        >
          Clear
        </button>
      )}
    </div>
  );
}
