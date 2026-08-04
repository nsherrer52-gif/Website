import type { ReactNode } from 'react'
import type { MuscleId, MuscleTarget } from '../types'
import { muscleName, volumeToColor } from '../lib/muscles'
import { roundVol } from '../lib/volume'

const NEUTRAL = '#20242b'

/**
 * Stylized front + back body silhouettes with each muscle region colored by how
 * many weekly sets it has received (see volumeToColor). Tap a region to select it.
 */
export function BodyMap({
  volume,
  targets,
  selected,
  onSelect,
}: {
  volume: Record<MuscleId, number>
  targets: Record<MuscleId, MuscleTarget>
  selected?: MuscleId | null
  onSelect?: (id: MuscleId) => void
}) {
  function Region({ id, children }: { id: MuscleId; children: ReactNode }) {
    const sets = volume[id] ?? 0
    return (
      <g
        fill={volumeToColor(sets, targets[id])}
        onClick={() => onSelect?.(id)}
        style={{ cursor: onSelect ? 'pointer' : 'default' }}
        stroke={selected === id ? '#eef0f4' : 'transparent'}
        strokeWidth={selected === id ? 1.6 : 0}
      >
        <title>
          {muscleName(id)}: {roundVol(sets)} sets
        </title>
        {children}
      </g>
    )
  }

  return (
    <svg viewBox="0 0 220 200" className="h-auto w-full select-none" role="img" aria-label="Muscle volume body map">
      {/* ---------------- FRONT (center x ≈ 55) ---------------- */}
      <circle cx="55" cy="15" r="10" fill={NEUTRAL} />
      <Region id="neck">
        <rect x="50" y="23" width="10" height="7" rx="2" />
      </Region>
      {/* neutral shins */}
      <ellipse cx="47" cy="170" rx="6" ry="16" fill={NEUTRAL} />
      <ellipse cx="63" cy="170" rx="6" ry="16" fill={NEUTRAL} />

      <Region id="sideDelts">
        <ellipse cx="30" cy="44" rx="5.5" ry="7.5" />
        <ellipse cx="80" cy="44" rx="5.5" ry="7.5" />
      </Region>
      <Region id="frontDelts">
        <circle cx="38" cy="40" r="8" />
        <circle cx="72" cy="40" r="8" />
      </Region>
      <Region id="chest">
        <ellipse cx="46" cy="53" rx="11" ry="8" />
        <ellipse cx="64" cy="53" rx="11" ry="8" />
      </Region>
      <Region id="biceps">
        <ellipse cx="30" cy="63" rx="5" ry="11" />
        <ellipse cx="80" cy="63" rx="5" ry="11" />
      </Region>
      <Region id="forearms">
        <ellipse cx="27" cy="85" rx="4.5" ry="12" />
        <ellipse cx="83" cy="85" rx="4.5" ry="12" />
      </Region>
      <Region id="abs">
        <rect x="46" y="61" width="18" height="30" rx="5" />
      </Region>
      <Region id="quads">
        <ellipse cx="46" cy="122" rx="8.5" ry="23" />
        <ellipse cx="64" cy="122" rx="8.5" ry="23" />
      </Region>
      <text x="55" y="197" textAnchor="middle" fontSize="9" fill="#5a6472">
        Front
      </text>

      {/* ---------------- BACK (center x ≈ 165) ---------------- */}
      <circle cx="165" cy="15" r="10" fill={NEUTRAL} />
      <Region id="neck">
        <rect x="160" y="23" width="10" height="7" rx="2" />
      </Region>
      {/* neutral forearms (back) */}
      <ellipse cx="137" cy="85" rx="4.5" ry="12" fill={NEUTRAL} />
      <ellipse cx="193" cy="85" rx="4.5" ry="12" fill={NEUTRAL} />

      <Region id="traps">
        <ellipse cx="165" cy="34" rx="15" ry="6.5" />
      </Region>
      <Region id="rearDelts">
        <circle cx="148" cy="42" r="7" />
        <circle cx="182" cy="42" r="7" />
      </Region>
      <Region id="upperBack">
        <rect x="156" y="42" width="18" height="16" rx="4" />
      </Region>
      <Region id="lats">
        <ellipse cx="152" cy="68" rx="7.5" ry="13" />
        <ellipse cx="178" cy="68" rx="7.5" ry="13" />
      </Region>
      <Region id="triceps">
        <ellipse cx="140" cy="63" rx="5" ry="11" />
        <ellipse cx="190" cy="63" rx="5" ry="11" />
      </Region>
      <Region id="spinalErectors">
        <ellipse cx="161.5" cy="76" rx="2.8" ry="14" />
        <ellipse cx="168.5" cy="76" rx="2.8" ry="14" />
      </Region>
      <Region id="glutes">
        <ellipse cx="158" cy="101" rx="8.5" ry="8" />
        <ellipse cx="172" cy="101" rx="8.5" ry="8" />
      </Region>
      <Region id="hamstrings">
        <ellipse cx="158" cy="130" rx="8" ry="21" />
        <ellipse cx="172" cy="130" rx="8" ry="21" />
      </Region>
      <Region id="calves">
        <ellipse cx="158" cy="168" rx="6.5" ry="14" />
        <ellipse cx="172" cy="168" rx="6.5" ry="14" />
      </Region>
      <text x="165" y="197" textAnchor="middle" fontSize="9" fill="#5a6472">
        Back
      </text>
    </svg>
  )
}
