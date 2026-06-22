import type { Program, Session, ID } from '../types'

/**
 * In a rotating split we suggest the next day based on the most recent
 * completed session in the program rotation. After the last day we wrap
 * back to the first.
 *
 * The suggestion is shared across profiles on purpose — training partners
 * usually move through the rotation together. You can always override it
 * and start any day you like.
 */
export function suggestedDayId(program: Program, sessions: Session[]): ID | null {
  if (program.days.length === 0) return null

  // Most recent completed (or started) session that used a day still in the program.
  const ordered = [...sessions]
    .filter((s) => program.days.some((d) => d.id === s.dayId))
    .sort((a, b) => (b.completedAt ?? b.startedAt) - (a.completedAt ?? a.startedAt))

  const last = ordered[0]
  if (!last) return program.days[0].id

  const idx = program.days.findIndex((d) => d.id === last.dayId)
  if (idx === -1) return program.days[0].id

  const nextIdx = (idx + 1) % program.days.length
  return program.days[nextIdx].id
}
