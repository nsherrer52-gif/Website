import type { MuscleId } from '../types'
import { muscleName, muscleRegionColor } from '../lib/muscles'

/**
 * RP-style colored muscle tag: uppercase chip tinted by the muscle's region
 * (Shoulders purple, Chest orange, Back cyan, Arms pink, Legs lime, Core amber).
 * The name is always spelled out — color is reinforcement, not the signal.
 */
export function MuscleTag({ muscleId, suffix }: { muscleId: MuscleId; suffix?: string }) {
  const color = muscleRegionColor(muscleId)
  return (
    <span
      className="chip border"
      style={{ color, borderColor: color + '59', backgroundColor: color + '17' }}
    >
      {muscleName(muscleId)}
      {suffix}
    </span>
  )
}
