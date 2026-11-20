export function Logo({ size = 30 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="7" fill="#11402f" />
      <path d="M8 9h7a4 4 0 0 1 0 8H8zm0 8h8a4 4 0 0 1 0 8H8z" fill="none" stroke="#f4f7f2" strokeWidth="2.4" />
      <circle cx="24" cy="9" r="2.6" fill="#e9a15f" />
      <path d="M24 11.6V20" stroke="#e9a15f" strokeWidth="2" />
    </svg>
  );
}
