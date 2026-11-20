// "Bit", the Byte & Bug mascot: an original friendly beetle, authored as SVG.
export function Mascot({ mood = 'happy', className = 'mascot', title }) {
  const mouth = mood === 'sad'
    ? <path d="M88 116q12-10 24 0" stroke="#1a1446" strokeWidth="5" fill="none" strokeLinecap="round" />
    : <path d="M86 110q14 14 28 0" stroke="#1a1446" strokeWidth="5" fill="none" strokeLinecap="round" />;
  return (
    <svg className={className} viewBox="0 0 200 200" role={title ? 'img' : undefined} aria-hidden={title ? undefined : 'true'} aria-label={title}>
      <path d="M78 46 60 18M122 46l18-28" stroke="#1a1446" strokeWidth="6" strokeLinecap="round" />
      <circle cx="58" cy="16" r="9" fill="#ffc83d" stroke="#1a1446" strokeWidth="5" />
      <circle cx="142" cy="16" r="9" fill="#ffc83d" stroke="#1a1446" strokeWidth="5" />
      <path d="M44 120 20 132M44 146l-22 18M156 120l24 12M156 146l22 18" stroke="#1a1446" strokeWidth="6" strokeLinecap="round" />
      <ellipse cx="100" cy="126" rx="62" ry="64" fill="#5b3df5" stroke="#1a1446" strokeWidth="6" />
      <path d="M100 66v124" stroke="#1a1446" strokeWidth="5" />
      <circle cx="72" cy="150" r="9" fill="#ffc83d" /><circle cx="128" cy="150" r="9" fill="#ffc83d" /><circle cx="122" cy="176" r="6" fill="#ffc83d" />
      <ellipse cx="100" cy="88" rx="46" ry="38" fill="#ffffff" stroke="#1a1446" strokeWidth="6" />
      <circle cx="82" cy="86" r="8" fill="#1a1446" /><circle cx="118" cy="86" r="8" fill="#1a1446" />
      <circle cx="85" cy="83" r="2.5" fill="#fff" /><circle cx="121" cy="83" r="2.5" fill="#fff" />
      {mouth}
    </svg>
  );
}
