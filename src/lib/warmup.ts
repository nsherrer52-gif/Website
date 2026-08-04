import type { WeightUnit } from '../types'
import { weightIncrement } from './progression'

// ---------------------------------------------------------------------------
// Warm-up ramp: a standard bar → 55% → 75% → 90% pyramid up to the working
// weight, rounded to real plate increments. Light dumbbell work just gets a
// short 55/75% ramp (no bar row).
// ---------------------------------------------------------------------------

export interface WarmupSet {
  weight: number
  reps: number
}

export function warmupRamp(working: number, bar: number, unit: WeightUnit): WarmupSet[] {
  if (working <= 0) return []
  const inc = weightIncrement(unit)
  const round = (w: number) => Math.round(w / inc) * inc

  const sets: WarmupSet[] = []
  if (working > bar * 1.5) sets.push({ weight: bar, reps: 10 })
  for (const [pct, reps] of [
    [0.55, 8],
    [0.75, 5],
    [0.9, 2],
  ] as const) {
    const w = round(working * pct)
    if (w >= working || w <= 0) continue
    if (sets.some((s) => s.weight === w)) continue
    if (sets.length > 0 && w <= sets[sets.length - 1].weight) continue
    sets.push({ weight: w, reps })
  }
  return sets
}
