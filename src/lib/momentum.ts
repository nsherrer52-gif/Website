import type { ID, LoggedExercise, Session } from '../types'
import { buildSetModel, setTarget } from './progression'

// ---------------------------------------------------------------------------
// Momentum: how you're performing RELATIVE TO THE APP'S OWN PREDICTIONS.
//
// For each recent session of an exercise we rebuild the target model as it
// stood BEFORE that session (a true backtest), then measure actual reps vs
// the goals it would have prescribed. Because the goals already embed
// progression, merely meeting them means you're gaining:
//   surge  — beating the goals        (▲▲)
//   gain   — on pace with them        (▲)
//   hold   — slightly under           (►)
//   slip   — well under               (▼)
// ---------------------------------------------------------------------------

export type MomentumLevel = 'surge' | 'gain' | 'hold' | 'slip'

export interface Momentum {
  level: MomentumLevel
  /** Mean reps vs goal (+ = beating predictions), recent sessions weighted. */
  score: number
  /** Number of sessions that could be scored. */
  sessions: number
}

function levelFor(score: number): MomentumLevel {
  if (score >= 0.5) return 'surge'
  if (score >= -0.3) return 'gain'
  if (score >= -1.2) return 'hold'
  return 'slip'
}

function scorableSets(ex: LoggedExercise) {
  const filled = ex.sets.filter((s) => s.weight != null && s.reps != null && s.reps > 0)
  const done = filled.filter((s) => s.done)
  return done.length > 0 ? done : filled
}

/** Mean (actual − goal) reps for one performance against a given model. */
export function scorePerformance(
  perf: LoggedExercise,
  prior: LoggedExercise[],
): number | null {
  const model = buildSetModel(prior)
  if (!model) return null
  const last = prior[0]
  const sets = scorableSets(perf)
  if (sets.length === 0) return null
  let sum = 0
  for (let i = 0; i < sets.length; i++) {
    const s = sets[i]
    const ls = last?.sets[i]
    const lastSame = ls && ls.weight === s.weight ? ls.reps : null
    sum += s.reps! - setTarget(model, s.weight!, i, lastSame)
  }
  return sum / sets.length
}

/** Chronological (oldest → newest) performances of an exercise. */
function performances(
  sessions: Session[],
  profileId: ID,
  name: string,
  excludeSessionId?: ID,
): LoggedExercise[] {
  const lower = name.trim().toLowerCase()
  return sessions
    .filter((s) => s.profileId === profileId && s.id !== excludeSessionId)
    .sort((a, b) => (a.completedAt ?? a.startedAt) - (b.completedAt ?? b.startedAt))
    .flatMap((s) => s.exercises.filter((e) => e.name.trim().toLowerCase() === lower))
    .filter((e) => e.sets.some((s) => s.weight != null && s.reps != null))
}

/**
 * Momentum for one exercise: backtest up to the 3 most recent performances
 * against models built from what came before each, weighting newest 3:2:1.
 * Null until there's enough history to score at least one session.
 */
export function exerciseMomentum(
  sessions: Session[],
  profileId: ID,
  name: string,
  excludeSessionId?: ID,
): Momentum | null {
  const all = performances(sessions, profileId, name, excludeSessionId)
  const weights = [3, 2, 1]
  let sum = 0
  let weight = 0
  let scored = 0
  for (let k = 0; k < weights.length; k++) {
    const idx = all.length - 1 - k
    if (idx < 1) break // need at least one prior performance to model from
    const prior = all.slice(Math.max(0, idx - 5), idx).reverse() // newest first
    const score = scorePerformance(all[idx], prior)
    if (score == null) continue
    sum += score * weights[k]
    weight += weights[k]
    scored++
  }
  if (scored === 0) return null
  const score = sum / weight
  return { level: levelFor(score), score, sessions: scored }
}

/**
 * One headline indicator across every exercise with scoreable history:
 * the average of per-exercise momentum scores.
 */
export function overallMomentum(
  sessions: Session[],
  profileId: ID,
): (Momentum & { exercises: number }) | null {
  const names = new Set<string>()
  for (const s of sessions) {
    if (s.profileId !== profileId) continue
    for (const e of s.exercises) if (e.name.trim()) names.add(e.name.trim().toLowerCase())
  }
  let sum = 0
  let count = 0
  for (const n of names) {
    const m = exerciseMomentum(sessions, profileId, n)
    if (m) {
      sum += m.score
      count++
    }
  }
  if (count === 0) return null
  const score = sum / count
  return { level: levelFor(score), score, sessions: count, exercises: count }
}
