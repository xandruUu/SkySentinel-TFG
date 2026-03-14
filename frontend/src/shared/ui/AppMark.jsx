import { useId } from "react";

export default function AppMark({ size = 96 }) {
  const gradientId = useId();

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <div
        aria-hidden="true"
        className="absolute -inset-6 rounded-[28px] bg-[radial-gradient(circle_at_50%_35%,color-mix(in_oklab,var(--color-secondary)_30%,transparent),transparent_70%)] blur-2xl"
      />

      <svg
        viewBox="0 0 120 120"
        className="relative h-full w-full drop-shadow-[0_20px_40px_rgba(30,58,138,0.2)]"
        fill="none"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="120" y2="120">
            <stop offset="0%" stopColor="var(--color-secondary)" />
            <stop offset="60%" stopColor="var(--color-primary)" />
            <stop offset="100%" stopColor="var(--color-radar)" />
          </linearGradient>
        </defs>

        <rect
          x="10"
          y="10"
          width="100"
          height="100"
          rx="28"
          fill={`url(#${gradientId})`}
        />

        <circle
          cx="60"
          cy="60"
          r="24"
          fill="rgba(255,255,255,0.18)"
          stroke="white"
          strokeWidth="3"
        />

        <path
          d="M60 24V96M24 60H96"
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
          opacity="0.9"
        />

        <path
          d="M39 81L65 55L81 39"
          stroke="white"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}