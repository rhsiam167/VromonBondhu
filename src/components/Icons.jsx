/**
 * Simple line icons (SVG), drawn in the style of the design.
 * Usage: <Icon name="camera" className="h-5 w-5" />
 */
const PATHS = {
  check: <path d="M20 6 9 17l-5-5" />,
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  home: (
    <>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V21h5v-6h4v6h5V9.5" />
    </>
  ),
  luggage: (
    <>
      <rect x="6" y="7" width="12" height="14" rx="2" />
      <path d="M9 7V4h6v3M10 11v6M14 11v6M9 21v1M15 21v1" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c1.2-3.5 4-5 7-5s5.8 1.5 7 5" />
    </>
  ),
  grip: (
    <>
      {[6, 12, 18].map((y) => (
        <g key={y}>
          <circle cx="9" cy={y} r="1.3" fill="currentColor" stroke="none" />
          <circle cx="15" cy={y} r="1.3" fill="currentColor" stroke="none" />
        </g>
      ))}
    </>
  ),
  chevronDown: <path d="m6 9 6 6 6-6" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  eye: (
    <>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  eyeOff: (
    <>
      <path d="M9.9 4.24A9.1 9.1 0 0 1 12 4c6.5 0 10 8 10 8a17.6 17.6 0 0 1-2.16 3.19" />
      <path d="M6.6 6.6C3.9 8.4 2 12 2 12s3.5 7 10 7a9.7 9.7 0 0 0 5.4-1.6" />
      <path d="M14.1 14.1a3 3 0 1 1-4.2-4.2M2 2l20 20" />
    </>
  ),
  logout: (
    <>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="m16 17 5-5-5-5M21 12H9" />
    </>
  ),
  mountain: <path d="m3 20 6-10 4 6 3-4 5 8Z" />,
  // Interest icons
  umbrella: (
    <>
      <path d="M13.5 6.5a8 8 0 0 0-11 11L13.5 6.5Z" />
      <path d="m13.5 6.5 3 3M8 12l9.5 9.5M12.5 3.5l2 2" />
    </>
  ),
  trees: (
    <>
      <path d="m8 3-5 8h3l-3 5h10l-3-5h3Z" />
      <path d="M8 16v5M16 8l-2.5 4h2L13 16h7l-2.5-4h2Z" />
      <path d="M16 16v5" />
    </>
  ),
  utensils: (
    <>
      <path d="M4 3v7a3 3 0 0 0 6 0V3M7 3v18" />
      <path d="M17 3c-2 0-3 2.5-3 6s1.5 4 3 4v8" />
      <path d="M17 3v18" />
    </>
  ),
  masks: (
    <>
      <path d="M3 8h9v4a4.5 4.5 0 0 1-9 0Z" />
      <path d="M12 5h9v4a4.5 4.5 0 0 1-6.5 4" />
      <path d="M5.5 11h.01M9.5 11h.01M15 8h.01M18.5 8h.01M6 14.5c.8.7 2.2.7 3 0" />
    </>
  ),
  compass: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m15.5 8.5-2 5-5 2 2-5Z" />
    </>
  ),
  camera: (
    <>
      <path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z" />
      <circle cx="12" cy="13.5" r="3.5" />
    </>
  ),
  bag: (
    <>
      <path d="M5 8h14l-1 13H6Z" />
      <path d="M9 10V6a3 3 0 0 1 6 0v4" />
    </>
  ),
  landmark: (
    <>
      <path d="M3 9h18L12 3Z" />
      <path d="M5 9v9M9.5 9v9M14.5 9v9M19 9v9M3 21h18M3 18h18" />
    </>
  ),
  lotus: (
    <>
      <path d="M12 20c-4 0-8-2.5-9-7 3 0 6 1.5 9 7Z" />
      <path d="M12 20c4 0 8-2.5 9-7-3 0-6 1.5-9 7Z" />
      <path d="M12 20c-2.5-2.5-3-6 0-11 3 5 2.5 8.5 0 11Z" />
    </>
  ),
  moon: <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z" />,
};

export default function Icon({ name, className = 'h-5 w-5', strokeWidth = 1.8 }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {PATHS[name]}
    </svg>
  );
}
