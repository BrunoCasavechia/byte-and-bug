// Byte & Bug mark: two overlapping blocks (a byte and the bug hiding behind it).
export function Logo({ size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
      <rect width="40" height="40" rx="10" fill="#5b3df5" />
      <rect x="9" y="9" width="14" height="14" rx="3.5" fill="#ffffff" />
      <rect x="17" y="17" width="14" height="14" rx="3.5" fill="#ffc83d" fillOpacity="0.95" />
    </svg>
  );
}
