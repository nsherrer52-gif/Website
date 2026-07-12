/**
 * The app's tiny resident: a lime bean who lives in quiet corners of the UI
 * (Smiski energy). Four poses:
 *   rest  — sitting contentedly (empty states, the Settings footer)
 *   cheer — arms up, open-mouthed (workout complete, rest over)
 *   lift  — pressing a tiny barbell overhead
 *   peek  — top of head + hands, gripping an edge (place overlapping a card top)
 */

const BODY = '#a3e635'
const OUTLINE = '#3f6212'
const INK = '#0b0d10'
const BLUSH = '#f472b6'

export type BuddyPose = 'rest' | 'cheer' | 'lift' | 'peek'

export function Buddy({ pose = 'rest', className }: { pose?: BuddyPose; className?: string }) {
  if (pose === 'peek') {
    return (
      <svg viewBox="0 0 64 30" className={className ?? 'h-7 w-14'} aria-hidden>
        {/* top of the head rising above an edge */}
        <path
          d="M13 30 C13 14 21 6 32 6 C43 6 51 14 51 30 Z"
          fill={BODY}
          stroke={OUTLINE}
          strokeWidth="2"
        />
        {/* wide curious eyes */}
        <circle cx="26" cy="22" r="2.4" fill={INK} />
        <circle cx="38" cy="22" r="2.4" fill={INK} />
        <circle cx="26.8" cy="21.2" r="0.8" fill="#fff" />
        <circle cx="38.8" cy="21.2" r="0.8" fill="#fff" />
        {/* little hands gripping the edge */}
        <ellipse cx="16" cy="28.5" rx="4.5" ry="3" fill={BODY} stroke={OUTLINE} strokeWidth="2" />
        <ellipse cx="48" cy="28.5" rx="4.5" ry="3" fill={BODY} stroke={OUTLINE} strokeWidth="2" />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 64 64" className={className ?? 'h-12 w-12'} aria-hidden>
      {pose === 'lift' && (
        <g>
          {/* barbell */}
          <line x1="8" y1="10" x2="56" y2="10" stroke="#8c95a3" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="11" cy="10" r="5" fill="#39404d" />
          <circle cx="53" cy="10" r="5" fill="#39404d" />
          {/* arms up to the bar */}
          <line x1="21" y1="26" x2="18" y2="12" stroke={OUTLINE} strokeWidth="7" strokeLinecap="round" />
          <line x1="43" y1="26" x2="46" y2="12" stroke={OUTLINE} strokeWidth="7" strokeLinecap="round" />
          <line x1="21" y1="26" x2="18" y2="12" stroke={BODY} strokeWidth="4" strokeLinecap="round" />
          <line x1="43" y1="26" x2="46" y2="12" stroke={BODY} strokeWidth="4" strokeLinecap="round" />
        </g>
      )}
      {pose === 'cheer' && (
        <g>
          {/* arms thrown up */}
          <line x1="17" y1="32" x2="9" y2="20" stroke={OUTLINE} strokeWidth="7" strokeLinecap="round" />
          <line x1="47" y1="32" x2="55" y2="20" stroke={OUTLINE} strokeWidth="7" strokeLinecap="round" />
          <line x1="17" y1="32" x2="9" y2="20" stroke={BODY} strokeWidth="4" strokeLinecap="round" />
          <line x1="47" y1="32" x2="55" y2="20" stroke={BODY} strokeWidth="4" strokeLinecap="round" />
          {/* sparkles */}
          <path d="M8 8 v6 M5 11 h6" stroke="#c9f57e" strokeWidth="1.6" strokeLinecap="round" />
          <path d="M57 6 v5 M54.5 8.5 h5" stroke="#c9f57e" strokeWidth="1.6" strokeLinecap="round" />
        </g>
      )}

      {/* bean body */}
      <path
        d="M32 14 C44 14 51 24 51 38 C51 52 43 58 32 58 C21 58 13 52 13 38 C13 24 20 14 32 14 Z"
        fill={BODY}
        stroke={OUTLINE}
        strokeWidth="2"
      />

      {/* face */}
      {pose === 'rest' ? (
        <g stroke={INK} strokeWidth="2" strokeLinecap="round" fill="none">
          {/* happy closed eyes */}
          <path d="M22 33 Q25.5 29.5 29 33" />
          <path d="M35 33 Q38.5 29.5 42 33" />
          <path d="M29 41 Q32 43.5 35 41" />
        </g>
      ) : (
        <g>
          <circle cx="25.5" cy="33" r="2.6" fill={INK} />
          <circle cx="38.5" cy="33" r="2.6" fill={INK} />
          <circle cx="26.4" cy="32.1" r="0.9" fill="#fff" />
          <circle cx="39.4" cy="32.1" r="0.9" fill="#fff" />
          {pose === 'cheer' ? (
            <ellipse cx="32" cy="42" rx="4" ry="4.6" fill={INK} />
          ) : (
            <path d="M29 41 Q32 43.5 35 41" stroke={INK} strokeWidth="2" strokeLinecap="round" fill="none" />
          )}
        </g>
      )}

      {/* blush */}
      <ellipse cx="20" cy="39" rx="3" ry="1.8" fill={BLUSH} opacity="0.35" />
      <ellipse cx="44" cy="39" rx="3" ry="1.8" fill={BLUSH} opacity="0.35" />

      {/* resting arms + feet */}
      {pose === 'rest' && (
        <g fill={BODY} stroke={OUTLINE} strokeWidth="2">
          <ellipse cx="14.5" cy="44" rx="4" ry="5.5" />
          <ellipse cx="49.5" cy="44" rx="4" ry="5.5" />
        </g>
      )}
      <g fill={BODY} stroke={OUTLINE} strokeWidth="2">
        <ellipse cx="25" cy="57.5" rx="4.5" ry="3" />
        <ellipse cx="39" cy="57.5" rx="4.5" ry="3" />
      </g>
    </svg>
  )
}
