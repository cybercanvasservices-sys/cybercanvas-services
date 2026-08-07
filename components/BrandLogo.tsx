type BrandLogoProps = {
  size?: number;
  inverted?: boolean;
  className?: string;
};

export default function BrandLogo({
  size = 44,
  inverted = false,
  className = "",
}: BrandLogoProps) {
  const background = inverted ? "#ffffff" : "#123b35";
  const primary = inverted ? "#123b35" : "#ffffff";

  return (
    <span
      className={`inline-flex shrink-0 overflow-hidden rounded-[22%] shadow-sm ${className}`}
      style={{ width: size, height: size }}
      role="img"
      aria-label="Logo CyberCanvas Services"
    >
      <svg viewBox="0 0 48 48" width={size} height={size} aria-hidden="true">
        <rect width="48" height="48" rx="11" fill={background} />
        <path
          d="M32.5 14.8a14 14 0 1 0 0 18.4"
          fill="none"
          stroke={primary}
          strokeWidth="5"
          strokeLinecap="round"
        />
        <path
          d="M24.5 19.5h7.2M24.5 28.5h7.2"
          fill="none"
          stroke="#47c2ad"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <circle cx="35.5" cy="19.5" r="2.4" fill="#47c2ad" />
        <circle cx="35.5" cy="28.5" r="2.4" fill="#47c2ad" />
      </svg>
    </span>
  );
}
