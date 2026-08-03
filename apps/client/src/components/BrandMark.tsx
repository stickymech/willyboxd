import { useId } from "react";

interface BrandMarkProps {
  className?: string;
}

export function BrandMark({ className }: BrandMarkProps) {
  const clipId = `brand-stripes-${useId().replace(/:/g, "")}`;

  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <clipPath id={clipId}>
        <rect x="18" y="10" width="28" height="44" rx="7" />
      </clipPath>
      <g fill="currentColor">
        <rect x="18" y="10" width="28" height="44" rx="7" />
      </g>
      <g
        clipPath={`url(#${clipId})`}
        style={{ stroke: "rgb(var(--color-bg))" }}
        strokeWidth="6"
        strokeLinecap="round"
      >
        <line x1="19" y1="24" x2="31" y2="12" />
        <line x1="34" y1="24" x2="46" y2="12" />
      </g>
    </svg>
  );
}
