import type { ExerciseSuggestion, LoggedExercise, WeightUnit } from '../types'

// ---------------------------------------------------------------------------
// Progressive-overload engine (double progression).
//
// The idea: work within the exercise's rep range (e.g. 8–12). When you hit the
// top of the range on all your top-weight sets — or you had 3+ reps in reserve —
// the next prescription adds weight and drops back to the bottom of the range.
// Otherwise the prescription is the same weight, chasing one more rep.
// ---------------------------------------------------------------------------

/** Smallest sensible plate jump per unit. */
export function weightIncrement(unit: WeightUnit): number {
  return unit === 'kg' ? 2.5 : 5
}

/** Parse a rep-range string like "8-12", "8–12" or "5" → { low, high }. */
export function parseRepRange(targetReps?: string): { low: number; high: number } | null {
  if (!targetReps) return null
  const range = targetReps.match(/(\d+)\s*(?:-|–|—|to)\s*(\d+)/i)
  if (range) {
    const low = Number(range[1])
    const high = Number(range[2])
    if (low > 0 && high >= low) return { low, high }
  }
  const single = targetReps.match(/(\d+)/)
  if (single) {
    const n = Number(single[1])
    if (n > 0) return { low: n, high: n }
  }
  return null
}

/** The sets that count for progression decisions: filled, preferring done ones. */
function workingSets(ex: LoggedExercise) {
  const filled = ex.sets.filter((s) => s.weight != null && s.reps != null && s.reps > 0)
  const done = filled.filter((s) => s.done)
  return done.length > 0 ? done : filled
}

/**
 * Compute the next-session prescription for an exercise from its most recent
 * logged performance. Returns a baseline suggestion when there's no history.
 */
export function suggestForExercise(
  last: LoggedExercise | null,
  unit: WeightUnit,
  targetReps?: string,
): ExerciseSuggestion {
  const range = parseRepRange(targetReps)
  const rangeText = range ? (range.low === range.high ? `${range.low}` : `${range.low}–${range.high}`) : targetReps || ''

  const sets = last ? workingSets(last) : []
  if (sets.length === 0) {
    return {
      weight: null,
      reps: rangeText,
      note: 'First time — pick a weight you can handle with good form and establish a baseline.',
      action: 'baseline',
    }
  }

  const topWeight = Math.max(...sets.map((s) => s.weight!))
  const topSets = sets.filter((s) => s.weight === topWeight)
  const bestReps = Math.max(...topSets.map((s) => s.reps!))
  // Double progression targets the WEAKEST top-weight set: you only add weight
  // once every set reaches the top of the range, so the weak set is what moves.
  const worstReps = Math.min(...topSets.map((s) => s.reps!))
  const repsList = topSets.map((s) => s.reps).join(', ')
  const inc = weightIncrement(unit)

  // 3+ reps in reserve across logged-RIR sets means the load is too light.
  const rirValues = sets.map((s) => s.rir).filter((r): r is number => r != null)
  const plentyInTank = rirValues.length > 0 && rirValues.reduce((a, b) => a + b, 0) / rirValues.length >= 3

  if (range) {
    const hitTopOnAllSets = topSets.every((s) => s.reps! >= range.high)
    if (hitTopOnAllSets || plentyInTank) {
      return {
        weight: topWeight + inc,
        reps: rangeText,
        note: hitTopOnAllSets
          ? `You hit ${range.high} reps across the board at ${topWeight} — add weight and build back up.`
          : `Plenty left in the tank last time (RIR 3+) — add weight.`,
        action: 'add_weight',
      }
    }
    const targetRep = Math.min(range.high, worstReps + 1)
    return {
      weight: topWeight,
      reps: `${targetRep}–${range.high}`,
      note:
        topSets.length > 1
          ? `Last time at ${topWeight}: ${repsList} reps. Push every set toward ${range.high}.`
          : `Last time: ${topWeight} × ${worstReps}. Beat it by a rep.`,
      action: 'add_reps',
    }
  }

  // No parseable rep range: still chase progressive overload.
  if (plentyInTank) {
    return {
      weight: topWeight + inc,
      reps: `${bestReps}`,
      note: 'Plenty left in the tank last time (RIR 3+) — add weight.',
      action: 'add_weight',
    }
  }
  return {
    weight: topWeight,
    reps: `${worstReps + 1}+`,
    note: `Last time: ${topWeight} × ${bestReps}. Beat it by a rep.`,
    action: 'add_reps',
  }
}

// ---------------------------------------------------------------------------
// Trend projection: least-squares fit over dated points, extended forward.
// Used by the Progress charts to show where a lift is heading.
// ---------------------------------------------------------------------------

export interface DatedPoint {
  /** ISO date "YYYY-MM-DD". */
  date: string
  value: number
}

export interface Projection {
  /** Metric change per week (positive = progressing). */
  slopePerWeek: number
  /** Future points at 1-week intervals after the last actual point. */
  points: DatedPoint[]
}

const MS_PER_DAY = 86400000

/**
 * Fit a line through the points and project `weeks` future values.
 * Returns null with fewer than 3 points (not enough signal).
 */
export function projectTrend(points: DatedPoint[], weeks = 4): Projection | null {
  if (points.length < 3) return null

  const t0 = new Date(points[0].date + 'T00:00:00').getTime()
  const xs = points.map((p) => (new Date(p.date + 'T00:00:00').getTime() - t0) / MS_PER_DAY)
  const ys = points.map((p) => p.value)
  const n = points.length

  const meanX = xs.reduce((a, b) => a + b, 0) / n
  const meanY = ys.reduce((a, b) => a + b, 0) / n
  let num = 0
  let den = 0
  for (let i = 0; i < n; i++) {
    num += (xs[i] - meanX) * (ys[i] - meanY)
    den += (xs[i] - meanX) * (xs[i] - meanX)
  }
  if (den === 0) return null
  const slope = num / den // per day
  const intercept = meanY - slope * meanX

  const lastX = xs[n - 1]
  const lastDate = new Date(points[n - 1].date + 'T00:00:00')
  const out: DatedPoint[] = []
  for (let w = 1; w <= weeks; w++) {
    const x = lastX + w * 7
    const d = new Date(lastDate.getTime() + w * 7 * MS_PER_DAY)
    const tz = d.getTimezoneOffset() * 60000
    out.push({
      date: new Date(d.getTime() - tz).toISOString().slice(0, 10),
      value: Math.max(0, Math.round((intercept + slope * x) * 10) / 10),
    })
  }
  return { slopePerWeek: Math.round(slope * 7 * 100) / 100, points: out }
}
