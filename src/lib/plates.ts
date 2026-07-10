import type { WeightUnit } from '../types'

// ---------------------------------------------------------------------------
// Plate calculator: which plates go on EACH SIDE of the bar for a target
// weight. Uses standard plate denominations, greedy from heaviest.
// ---------------------------------------------------------------------------

export const PLATES_LB = [45, 35, 25, 10, 5, 2.5]
export const PLATES_KG = [25, 20, 15, 10, 5, 2.5, 1.25]

export function platesForUnit(unit: WeightUnit): number[] {
  return unit === 'kg' ? PLATES_KG : PLATES_LB
}

export interface PlateBreakdown {
  /** [plate size, count] pairs for ONE side of the bar, heaviest first. */
  counts: [number, number][]
  /** Per-side weight that couldn't be made with standard plates (0 = exact). */
  remainder: number
  /** Total weight minus the bar, split per side. */
  perSide: number
}

/**
 * Compute the per-side plate loading for a total weight on a given bar.
 * Returns null when the target is below the bar itself.
 */
export function platesPerSide(total: number, bar: number, plates: number[]): PlateBreakdown | null {
  if (total < bar) return null
  let perSideLeft = (total - bar) / 2
  const perSide = perSideLeft
  const counts: [number, number][] = []
  for (const p of plates) {
    const n = Math.floor((perSideLeft + 1e-9) / p)
    if (n > 0) {
      counts.push([p, n])
      perSideLeft = Math.round((perSideLeft - n * p) * 1000) / 1000
    }
  }
  return { counts, remainder: perSideLeft, perSide }
}

/** Human string for one side, e.g. "45 ×2 · 25 · 2.5". Empty bar → "". */
export function formatPlates(b: PlateBreakdown): string {
  return b.counts.map(([p, n]) => (n > 1 ? `${p} ×${n}` : `${p}`)).join(' · ')
}
