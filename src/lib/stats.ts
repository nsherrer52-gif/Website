import type { ID, LoggedExercise, SetEntry, Session, WeightUnit } from '../types'

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

/**
 * Best estimated 1RM including reps-in-reserve: what you COULD have done.
 * A set of 8 at RIR 2 counts as a 10-rep effort. Falls back to plain reps
 * when RIR wasn't logged.
 */
export function bestPotential1RM(ex: LoggedExercise): number {
  let best = 0
  for (const s of ex.sets) {
    if (s.weight == null || s.reps == null || s.reps <= 0) continue
    best = Math.max(best, epley1RM(s.weight, s.reps + (s.rir ?? 0)))
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

// --- Lifetime tonnage -------------------------------------------------------

/** Total weight ever lifted by a profile (Σ weight × reps across all sessions). */
export function lifetimeTonnage(sessions: Session[], profileId: ID): number {
  return sessions
    .filter((s) => s.profileId === profileId)
    .reduce((sum, s) => sum + sessionVolume(s), 0)
}

/** Reference objects for fun comparisons, in pounds, ascending. */
const REFERENCES: [number, string, string][] = [
  [4_000, 'car', 'cars'],
  [13_000, 'elephant', 'elephants'],
  [90_000, 'Boeing 737', 'Boeing 737s'],
  [300_000, 'blue whale', 'blue whales'],
  [450_000, 'Statue of Liberty', 'Statues of Liberty'],
  [925_000, 'International Space Station', 'International Space Stations'],
]

/**
 * A fun real-world equivalence for a lifetime tonnage, e.g. "≈ 92 elephants".
 * Picks the largest reference that fits at least once; below one car it
 * returns '' (early days — no comparison yet).
 */
export function funEquivalence(total: number, unit: WeightUnit): string {
  const lb = unit === 'kg' ? total * 2.2046 : total
  let chosen: [number, string, string] | null = null
  for (const ref of REFERENCES) {
    if (lb >= ref[0]) chosen = ref
    else break
  }
  if (!chosen) return ''
  const count = Math.round(lb / chosen[0])
  return `≈ ${count.toLocaleString()} ${count === 1 ? chosen[1] : chosen[2]}`
}
