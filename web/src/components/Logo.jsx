export function Logo({ size = 38 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
      <rect width="40" height="40" rx="12" fill="#5b3df5" />
      <path d="M15 11 12 6M25 11l3-5" stroke="#ffc83d" strokeWidth="2.5" strokeLinecap="round" />
      <ellipse cx="20" cy="23" rx="11" ry="12" fill="#fff" />
      <path d="M20 12v23" stroke="#5b3df5" strokeWidth="2.5" />
      <circle cx="16" cy="19" r="2" fill="#1a1446" /><circle cx="24" cy="19" r="2" fill="#1a1446" />
    </svg>
  );
}
