interface LogoProps {
  className?: string;
  size?: number;
}

export default function Logo({ className = '', size = 48 }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Book spine - vertical rectangle */}
      <rect
        x="14"
        y="8"
        width="20"
        height="32"
        rx="1"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />

      {/* Bookmark ribbon - integrated accent mark */}
      <path
        d="M24 8 L24 20 L26 18 L28 20 L28 8"
        fill="currentColor"
        opacity="0.8"
      />

      {/* Subtle spine detail lines */}
      <line
        x1="16"
        y1="14"
        x2="32"
        y2="14"
        stroke="currentColor"
        strokeWidth="0.5"
        opacity="0.3"
      />
      <line
        x1="16"
        y1="34"
        x2="32"
        y2="34"
        stroke="currentColor"
        strokeWidth="0.5"
        opacity="0.3"
      />
    </svg>
  );
}

// Variant with text
export function LogoWithText({ className = '', size = 48 }: LogoProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <Logo size={size} />
      <span className="font-medium tracking-tight text-xl">
        Reservé
      </span>
    </div>
  );
}
