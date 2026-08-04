import type { ID, MuscleContribution, MuscleId, MuscleTarget, Session } from '../types'
import { DEFAULT_MUSCLE_TARGETS, MUSCLES } from './muscles'
import { isoWeekKey, roundVol, weeklyMuscleVolume } from './volume'

// ---------------------------------------------------------------------------
// The weekly volume coach (RP-style rolling auto-regulation).
//
// Looks at LAST week's completed sets per muscle against your target range
// (min ≈ minimum effective volume, max ≈ maximum recoverable volume) and
// prescribes this week's set count:
//   below min      → build up toward the minimum
//   in range       → add ~1 set (progressive overload)
//   at/above max   → hold, don't pile on more
//   4+ straight weeks at or above min → suggest a ~50% deload week
// ---------------------------------------------------------------------------

export type CoachAction = 'increase' | 'hold' | 'deload' | 'start'

export interface MuscleRecommendation {
  muscleId: MuscleId
  /** Completed sets last week (fractional credits included). */
  lastWeekSets: number
  /** Prescribed sets for this week. */
  suggestedSets: number
  action: CoachAction
  reason: string
}

/** Local ISO date `days` ago. */
function isoDaysAgo(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  const tz = d.getTimezoneOffset() * 60000
  return new Date(d.getTime() - tz).toISOString().slice(0, 10)
}

/**
 * Recommendations for the current week, one per muscle, in taxonomy order.
 */
export function weeklyRecommendations(
  sessions: Session[],
  profileId: ID,
  libraryOverrides: Record<string, MuscleContribution>,
  targets: Record<MuscleId, MuscleTarget>,
): MuscleRecommendation[] {
  const weekTotals = new Map(
    weeklyMuscleVolume(sessions, profileId, libraryOverrides).map((w) => [w.key, w.totals]),
  )
  const prevWeekKey = isoWeekKey(isoDaysAgo(7))

  return MUSCLES.map((m) => {
    const target = targets[m.id] ?? DEFAULT_MUSCLE_TARGETS[m.id] ?? { min: 8, max: 16 }
    const last = roundVol(weekTotals.get(prevWeekKey)?.[m.id] ?? 0)

    // Consecutive past weeks (starting last week) at or above the minimum.
    let streak = 0
    for (let w = 1; w <= 12; w++) {
      const sets = weekTotals.get(isoWeekKey(isoDaysAgo(7 * w)))?.[m.id] ?? 0
      if (sets >= Math.max(1, target.min)) streak++
      else break
    }

    if (streak >= 4) {
      return {
        muscleId: m.id,
        lastWeekSets: last,
        suggestedSets: Math.max(2, Math.round(target.min / 2)),
        action: 'deload' as const,
        reason: `${streak} straight weeks at or above your minimum — take a lighter week (~50%) to recover, then ramp back up.`,
      }
    }
    if (last <= 0) {
      return {
        muscleId: m.id,
        lastWeekSets: last,
        suggestedSets: target.min,
        action: 'start' as const,
        reason: 'Not trained last week — start back at your minimum.',
      }
    }
    if (last < target.min) {
      return {
        muscleId: m.id,
        lastWeekSets: last,
        suggestedSets: Math.min(target.min, Math.ceil(last) + 2),
        action: 'increase' as const,
        reason: 'Below your minimum — build up.',
      }
    }
    if (last < target.max) {
      return {
        muscleId: m.id,
        lastWeekSets: last,
        suggestedSets: roundVol(Math.min(target.max, last + 1)),
        action: 'increase' as const,
        reason: 'In range and recovering — add a set to keep progressing.',
      }
    }
    return {
      muscleId: m.id,
      lastWeekSets: last,
      suggestedSets: target.max,
      action: 'hold' as const,
      reason: 'At your maximum — hold here rather than adding more.',
    }
  })
}
