interface BrandMarkProps {
  className?: string;
}

const DISC_RADIUS = 42;

const DISCS = [
  { cx: 64, cy: 44, fill: "#F57C00" },
  { cx: 120, cy: 60, fill: "#44C553" },
  { cx: 176, cy: 76, fill: "#29B6F6" },
];

function Rocket({ cx, cy }: { cx: number; cy: number }) {
  return (
    <g transform={`translate(${cx} ${cy}) scale(0.8)`} fill="#0F172A">
      <path d="M-13 -18 C-13 -40 13 -40 13 -18 L-13 -18 Z" />
      <path d="M-10 -18 L10 -18 L12 24 C12 30 -12 30 -12 24 Z" />
      <path d="M11 22 L19 32 L13 29 Z" />
      <path d="M-11 22 L-19 32 L-13 29 Z" />
      <circle cx="-9" cy="35" r="8" />
      <circle cx="9" cy="35" r="8" />
      <circle cx="0" cy="-8" r="3.5" fill="#fff" opacity="0.9" />
    </g>
  );
}

export function BrandMark({ className }: BrandMarkProps) {
  return (
    <svg
      viewBox="0 0 240 120"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {[...DISCS].reverse().map((d) => (
        <circle key={d.fill} cx={d.cx} cy={d.cy} r={DISC_RADIUS} fill={d.fill} />
      ))}
      {DISCS.map((d) => (
        <Rocket key={d.fill} cx={d.cx} cy={d.cy} />
      ))}
    </svg>
  );
}
