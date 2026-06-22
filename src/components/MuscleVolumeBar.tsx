import type { MuscleTarget } from '../types'
import { statusColor, volumeStatus } from '../lib/muscles'
import { roundVol } from '../lib/volume'

/**
 * A horizontal bar showing weekly sets for one muscle against its target range.
 * The colored fill reflects status (under / in-range / over); thin markers show
 * the min and max of the target band.
 */
export function MuscleVolumeBar({
  name,
  sets,
  target,
}: {
  name: string
  sets: number
  target: MuscleTarget
}) {
  const status = volumeStatus(sets, target)
  const color = statusColor(status)
  const scale = Math.max(target.max * 1.2, sets, 1)
  const fillPct = Math.min(100, (sets / scale) * 100)
  const minPct = Math.min(100, (target.min / scale) * 100)
  const maxPct = Math.min(100, (target.max / scale) * 100)

  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between text-sm">
        <span className="font-medium">{name}</span>
        <span style={{ color }} className="font-semibold tabular-nums">
          {roundVol(sets)}
          <span className="ml-1 text-xs font-normal text-slate-500">
            / {target.min}–{target.max}
          </span>
        </span>
      </div>
      <div className="relative h-2.5 overflow-hidden rounded-full bg-slate-900/70">
        {/* target "good zone" */}
        <div
          className="absolute inset-y-0 bg-slate-600/30"
          style={{ left: `${minPct}%`, width: `${Math.max(0, maxPct - minPct)}%` }}
        />
        {/* fill */}
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all"
          style={{ width: `${fillPct}%`, backgroundColor: color }}
        />
        {/* min / max markers */}
        <div className="absolute inset-y-0 w-px bg-slate-400/50" style={{ left: `${minPct}%` }} />
        <div className="absolute inset-y-0 w-px bg-slate-300/60" style={{ left: `${maxPct}%` }} />
      </div>
    </div>
  )
}
