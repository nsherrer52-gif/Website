import type { ID, LoggedExercise, MuscleContribution, MuscleId, Session } from '../types'
import { hasMuscles, resolveMuscles } from './exerciseLibrary'
import { todayISO } from './date'

// ---------------------------------------------------------------------------
// Weekly muscle volume: counts checked-off ("done") sets, weighted by each
// exercise's fractional muscle contributions.
// ---------------------------------------------------------------------------

/** Muscle map for a logged exercise: prefer its snapshot, else resolve by name. */
function musclesFor(
  le: LoggedExercise,
  libraryOverrides: Record<string, MuscleContribution>,
): MuscleContribution {
  if (hasMuscles(le.muscles)) return le.muscles!
  return resolveMuscles(le.name, undefined, libraryOverrides)
}

/** Number of completed sets for a logged exercise (the "done" checkbox). */
export function doneSetCount(le: LoggedExercise): number {
  return le.sets.filter((s) => s.done).length
}

/** Sum a list of sessions into per-muscle set totals. */
export function muscleVolumeForSessions(
  sessions: Session[],
  libraryOverrides: Record<string, MuscleContribution>,
): Record<MuscleId, number> {
  const totals: Record<MuscleId, number> = {}
  for (const sess of sessions) {
    for (const le of sess.exercises) {
      const sets = doneSetCount(le)
      if (sets === 0) continue
      const muscles = musclesFor(le, libraryOverrides)
      for (const [muscleId, fraction] of Object.entries(muscles)) {
        if (!fraction) continue
        totals[muscleId] = (totals[muscleId] ?? 0) + sets * fraction
      }
    }
  }
  return totals
}

// --- ISO week handling ------------------------------------------------------

/** ISO-8601 week (Mon–Sun) key for a "YYYY-MM-DD" date, e.g. "2026-W25". */
export function isoWeekKey(dateISO: string): string {
  const [y, m, d] = dateISO.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1, d))
  const dayNum = (date.getUTCDay() + 6) % 7 // Mon = 0
  date.setUTCDate(date.getUTCDate() - dayNum + 3) // nearest Thursday
  const firstThursday = new Date(Date.UTC(date.getUTCFullYear(), 0, 4))
  const firstDayNum = (firstThursday.getUTCDay() + 6) % 7
  firstThursday.setUTCDate(firstThursday.getUTCDate() - firstDayNum + 3)
  const week = 1 + Math.round((date.getTime() - firstThursday.getTime()) / (7 * 86400000))
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, '0')}`
}

/** Monday (local) of the week containing the given date, as "YYYY-MM-DD". */
export function weekStartISO(dateISO: string): string {
  const [y, m, d] = dateISO.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const dayNum = (date.getDay() + 6) % 7 // Mon = 0
  date.setDate(date.getDate() - dayNum)
  const tz = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - tz).toISOString().slice(0, 10)
}

export function currentWeekKey(): string {
  return isoWeekKey(todayISO())
}

export interface WeeklyVolume {
  key: string
  start: string // Monday ISO date
  totals: Record<MuscleId, number>
}

/** Per-week muscle totals for one profile, sorted oldest → newest. */
export function weeklyMuscleVolume(
  sessions: Session[],
  profileId: ID,
  libraryOverrides: Record<string, MuscleContribution>,
): WeeklyVolume[] {
  const byWeek = new Map<string, Session[]>()
  for (const s of sessions) {
    if (s.profileId !== profileId) continue
    const key = isoWeekKey(s.date)
    const arr = byWeek.get(key) ?? []
    arr.push(s)
    byWeek.set(key, arr)
  }
  return [...byWeek.entries()]
    .map(([key, sess]) => ({
      key,
      start: weekStartISO(sess[0].date),
      totals: muscleVolumeForSessions(sess, libraryOverrides),
    }))
    .sort((a, b) => a.start.localeCompare(b.start))
}

/** Per-muscle totals for the current ISO week, for one profile. */
export function currentWeekVolume(
  sessions: Session[],
  profileId: ID,
  libraryOverrides: Record<string, MuscleContribution>,
): Record<MuscleId, number> {
  const key = currentWeekKey()
  const thisWeek = sessions.filter((s) => s.profileId === profileId && isoWeekKey(s.date) === key)
  return muscleVolumeForSessions(thisWeek, libraryOverrides)
}

/** Round to 1 decimal (volume can be fractional, e.g. 1.5). */
export function roundVol(n: number): number {
  return Math.round(n * 10) / 10
}
