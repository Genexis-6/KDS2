type BrandProps = {
  /** "sm" for the navigation bar, "lg" for the sign-in screen */
  size?: "sm" | "lg";
};

/** The CBX logotype: a sky-blue mark beside a widely-tracked wordmark. */
export default function Brand({ size = "sm" }: BrandProps) {
  return (
    <span className={`cbx-brand cbx-brand-${size}`}>
      <svg className="cbx-brand-mark" viewBox="0 0 32 32" role="img" aria-label="CBX logo">
        <defs>
          <linearGradient id="cbx-mark-fill" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#5BB4EE" />
            <stop offset="1" stopColor="#1479C4" />
          </linearGradient>
        </defs>
        <rect width="32" height="32" rx="10" fill="url(#cbx-mark-fill)" />
        <path
          d="M10.5 10.5l11 11M21.5 10.5l-11 11"
          stroke="#fff"
          strokeWidth="2.6"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
      <span className="cbx-brand-word">CBX</span>
    </span>
  );
}
