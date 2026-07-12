import type { ID, Session } from '../types'
import { doneSetCount, isoWeekKey } from './volume'
import { todayISO } from './date'

// ---------------------------------------------------------------------------
// Training consistency: day-by-day set counts for the heatmap, plus streaks.
// ---------------------------------------------------------------------------

function isoDaysAgo(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  const tz = d.getTimezoneOffset() * 60000
  return new Date(d.getTime() - tz).toISOString().slice(0, 10)
}

export interface DayCell {
  /** ISO date "YYYY-MM-DD". */
  date: string
  /** Completed sets logged that day. */
  sets: number
}

/**
 * Completed sets per day for the last `days` days (oldest → today), padded so
 * the range starts on a Monday — ready to render as week columns.
 */
export function dailySetCounts(sessions: Session[], profileId: ID, days = 140): DayCell[] {
  const counts = new Map<string, number>()
  for (const s of sessions) {
    if (s.profileId !== profileId) continue
    const sets = s.exercises.reduce((n, e) => n + doneSetCount(e), 0)
    if (sets > 0) counts.set(s.date, (counts.get(s.date) ?? 0) + sets)
  }

  // Pad back to the Monday on/before the range start.
  const first = new Date(isoDaysAgo(days - 1) + 'T00:00:00')
  const pad = (first.getDay() + 6) % 7 // days since Monday
  const total = days + pad

  const out: DayCell[] = []
  for (let i = total - 1; i >= 0; i--) {
    const date = isoDaysAgo(i)
    out.push({ date, sets: counts.get(date) ?? 0 })
  }
  return out
}

/**
 * Consecutive ISO weeks with at least one completed workout, counting back
 * from the current week. An empty current week doesn't break the streak
 * (the week isn't over yet) — it just doesn't count.
 */
export function weeklyStreak(sessions: Session[], profileId: ID): number {
  const weeks = new Set<string>()
  for (const s of sessions) {
    if (s.profileId === profileId && s.completedAt != null) weeks.add(isoWeekKey(s.date))
  }
  let streak = 0
  let w = weeks.has(isoWeekKey(todayISO())) ? 0 : 1
  while (weeks.has(isoWeekKey(isoDaysAgo(7 * w)))) {
    streak++
    w++
  }
  return streak
}

/** Completed workouts in the current calendar month. */
export function workoutsThisMonth(sessions: Session[], profileId: ID): number {
  const month = todayISO().slice(0, 7)
  return sessions.filter(
    (s) => s.profileId === profileId && s.completedAt != null && s.date.startsWith(month),
  ).length
}
