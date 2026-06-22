import type { LoggedExercise, SetEntry, Session } from '../types'

/**
 * Estimated one-rep max using the Epley formula:
 *   1RM ≈ weight * (1 + reps / 30)
 * A single set at 1 rep returns the weight itself.
 */
export function epley1RM(weight: number, reps: number): number {
  if (reps <= 1) return weight
  return weight * (1 + reps / 30)
}

/** Best estimated 1RM across all sets of a logged exercise. */
export function bestEstimated1RM(ex: LoggedExercise): number {
  let best = 0
  for (const s of ex.sets) {
    if (s.weight == null || s.reps == null || s.reps <= 0) continue
    best = Math.max(best, epley1RM(s.weight, s.reps))
  }
  return best
}

/** Heaviest weight lifted for any set of a logged exercise. */
export function topSetWeight(ex: LoggedExercise): number {
  let best = 0
  for (const s of ex.sets) {
    if (s.weight == null) continue
    best = Math.max(best, s.weight)
  }
  return best
}

/** Total volume = sum of weight * reps across completed-value sets. */
export function totalVolume(ex: LoggedExercise): number {
  let v = 0
  for (const s of ex.sets) {
    if (s.weight == null || s.reps == null) continue
    v += s.weight * s.reps
  }
  return v
}

/** Volume for an entire session across all its exercises. */
export function sessionVolume(session: Session): number {
  return session.exercises.reduce((sum, ex) => sum + totalVolume(ex), 0)
}

/** Compact summary of a set, e.g. "135 × 8". Returns "—" if empty. */
export function describeSet(s: SetEntry): string {
  if (s.weight == null && s.reps == null) return '—'
  const w = s.weight == null ? '?' : String(s.weight)
  const r = s.reps == null ? '?' : String(s.reps)
  return `${w} × ${r}`
}

/** Round to at most 1 decimal place for display. */
export function round1(n: number): number {
  return Math.round(n * 10) / 10
}
