import type { ID, Session } from '../types'
import { bestEstimated1RM } from './stats'

// ---------------------------------------------------------------------------
// Personal records: an exercise in a session is a PR when its best estimated
// 1RM beats every earlier session's best for that same exercise (by name).
// ---------------------------------------------------------------------------

function key(sessionId: ID, exIndex: number): string {
  return `${sessionId}#${exIndex}`
}

function normalize(name: string): string {
  return name.trim().toLowerCase()
}

/**
 * Returns a set of "sessionId#exIndex" keys that represent a new e1RM PR.
 * Considers only the given profile's sessions, processed chronologically.
 */
export function computePRSet(sessions: Session[], profileId: ID): Set<string> {
  const prs = new Set<string>()

  // Flatten to (date, startedAt, sessionId, exIndex, name, e1RM), oldest first.
  const rows: {
    sessionId: ID
    exIndex: number
    name: string
    e1RM: number
    date: string
    startedAt: number
  }[] = []

  for (const s of sessions) {
    if (s.profileId !== profileId) continue
    s.exercises.forEach((le, exIndex) => {
      const e1RM = bestEstimated1RM(le)
      if (e1RM > 0) {
        rows.push({ sessionId: s.id, exIndex, name: le.name, e1RM, date: s.date, startedAt: s.startedAt })
      }
    })
  }

  rows.sort((a, b) => a.date.localeCompare(b.date) || a.startedAt - b.startedAt)

  const best: Record<string, number> = {}
  for (const r of rows) {
    const n = normalize(r.name)
    const prev = best[n] ?? 0
    if (r.e1RM > prev + 1e-9) {
      // First-ever entry for an exercise isn't flagged as a "record" — it's the baseline.
      if (prev > 0) prs.add(key(r.sessionId, r.exIndex))
      best[n] = r.e1RM
    }
  }

  return prs
}

export const prKey = key
