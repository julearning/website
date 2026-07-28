/**
 * JUThumbnail — elegant fallback thumbnail for jammu-university documents
 * that don't have a Google Drive thumbnail.
 *
 * Displays a clean JU crest / university seal placeholder in a 9:16
 * portrait aspect ratio for documents from the Jammu University source.
 *
 * The SVG viewBox is 180x320 (exact 9:16 = 180/320).
 * All horizontal coords center at x=90.
 */
export function JUThumbnail() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-gradient-to-b from-[#1a1a2e] via-[#16213e] to-[#0f3460] p-6">
      <svg
        viewBox="0 0 180 320"
        className="h-full w-full"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Outer ring */}
        <circle cx="90" cy="100" r="80" stroke="rgba(255,255,255,0.12)" strokeWidth="2" fill="none" />
        <circle cx="90" cy="100" r="72" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" fill="none" />

        {/* Inner decorative ring */}
        <circle cx="90" cy="100" r="64" stroke="rgba(255,255,255,0.08)" strokeWidth="1" fill="none" strokeDasharray="4 4" />

        {/* Crest crown / open book */}
        <path
          d="M52 128 L52 72 Q52 54 72 54 L90 58 L108 54 Q128 54 128 72 L128 128"
          stroke="rgba(255,255,255,0.5)"
          strokeWidth="2"
          fill="none"
          opacity="0.7"
        />
        {/* Book spine */}
        <line x1="90" y1="58" x2="90" y2="128" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />

        {/* Pages left */}
        <path d="M54 74 L54 126" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
        <path d="M56 71 L56 126" stroke="rgba(255,255,255,0.15)" strokeWidth="0.8" />

        {/* Pages right */}
        <path d="M126 74 L126 126" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
        <path d="M124 71 L124 126" stroke="rgba(255,255,255,0.15)" strokeWidth="0.8" />

        {/* "JU" letters */}
        <text
          x="90"
          y="170"
          textAnchor="middle"
          fill="rgba(255,255,255,0.9)"
          fontSize="34"
          fontWeight="700"
          fontFamily="system-ui, sans-serif"
          letterSpacing="4"
        >
          JU
        </text>

        {/* Decorative dots */}
        <circle cx="52" cy="192" r="1.5" fill="rgba(255,255,255,0.2)" />
        <circle cx="90" cy="192" r="1.5" fill="rgba(255,255,255,0.2)" />
        <circle cx="128" cy="192" r="1.5" fill="rgba(255,255,255,0.2)" />

        {/* Bottom line */}
        <line x1="58" y1="198" x2="122" y2="198" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />

        {/* "JAMMU" */}
        <text
          x="90"
          y="214"
          textAnchor="middle"
          fill="rgba(255,255,255,0.45)"
          fontSize="8"
          fontFamily="system-ui, sans-serif"
          letterSpacing="6"
        >
          JAMMU
        </text>

        {/* "UNIVERSITY" */}
        <text
          x="90"
          y="230"
          textAnchor="middle"
          fill="rgba(255,255,255,0.35)"
          fontSize="7"
          fontFamily="system-ui, sans-serif"
          letterSpacing="5"
        >
          UNIVERSITY
        </text>

        {/* Light sparkle highlights */}
        <circle cx="64" cy="74" r="1.5" fill="rgba(255,255,255,0.08)" />
        <circle cx="116" cy="74" r="1.5" fill="rgba(255,255,255,0.06)" />
        <circle cx="90" cy="130" r="1" fill="rgba(255,255,255,0.08)" />

        {/* Top arch decoration */}
        <path
          d="M62 50 Q90 34 118 50"
          stroke="rgba(255,255,255,0.12)"
          strokeWidth="1"
          fill="none"
        />
      </svg>
    </div>
  );
}
