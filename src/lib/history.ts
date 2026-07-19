import type { ID, LoggedExercise, Session } from '../types'
import { describeSet } from './stats'

/**
 * Find the most recent time a profile logged an exercise with the given name,
 * excluding the current session. Used to show "Last time: 135 × 8" hints
 * while you train so you know what to beat.
 */
export function lastPerformance(
  sessions: Session[],
  profileId: ID,
  exerciseName: string,
  excludeSessionId?: ID,
): { date: string; exercise: LoggedExercise } | null {
  const matches = sessions
    .filter((s) => s.profileId === profileId && s.id !== excludeSessionId)
    .filter((s) => s.exercises.some((e) => sameName(e.name, exerciseName)))
    .sort((a, b) => (b.completedAt ?? b.startedAt) - (a.completedAt ?? a.startedAt))

  const session = matches[0]
  if (!session) return null
  const exercise = session.exercises.find((e) => sameName(e.name, exerciseName))!
  return { date: session.date, exercise }
}

/**
 * The most recent logged performances of an exercise (newest first), for
 * fitting the per-set target model. Only entries with real set data count.
 */
export function recentPerformances(
  sessions: Session[],
  profileId: ID,
  exerciseName: string,
  excludeSessionId?: ID,
  limit = 5,
): LoggedExercise[] {
  return sessions
    .filter((s) => s.profileId === profileId && s.id !== excludeSessionId)
    .sort((a, b) => (b.completedAt ?? b.startedAt) - (a.completedAt ?? a.startedAt))
    .flatMap((s) => s.exercises.filter((e) => sameName(e.name, exerciseName)))
    .filter((e) => e.sets.some((s) => s.weight != null && s.reps != null))
    .slice(0, limit)
}

/** One-line summary of an exercise's logged sets, e.g. "135 × 8, 135 × 8, 145 × 6". */
export function summarizeSets(ex: LoggedExercise): string {
  const filled = ex.sets.filter((s) => s.weight != null || s.reps != null)
  if (filled.length === 0) return 'no sets logged'
  return filled.map(describeSet).join(', ')
}

/** Distinct exercise names this profile has ever logged, sorted alphabetically. */
export function loggedExerciseNames(sessions: Session[], profileId: ID): string[] {
  const names = new Set<string>()
  for (const s of sessions) {
    if (s.profileId !== profileId) continue
    for (const e of s.exercises) {
      if (e.name.trim()) names.add(e.name) // skip unfilled muscle slots
    }
  }
  return [...names].sort((a, b) => a.localeCompare(b))
}

function sameName(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase()
}
