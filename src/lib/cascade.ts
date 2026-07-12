import type { ID, SetEntry } from '../types'

/**
 * Weight cascade: when a set's weight is edited, flow the new value down to
 * every LATER set that is still in lockstep — i.e. not checked off, and either
 * empty or holding the same value the edited set had before the change.
 *
 * This makes "set the weight once" work (all prefilled/blank followers move),
 * while a deliberately different set (e.g. a back-off set you typed as 135)
 * stays put. Rapid stepper taps chain correctly because followers are updated
 * to match on every step.
 */
export function applyWeightCascade(
  sets: SetEntry[],
  setId: ID,
  weight: number | null,
): SetEntry[] {
  const idx = sets.findIndex((s) => s.id === setId)
  if (idx === -1) return sets
  const previous = sets[idx].weight

  return sets.map((s, i) => {
    if (i === idx) return { ...s, weight }
    if (i < idx || s.done) return s
    if (s.weight == null || s.weight === previous) return { ...s, weight }
    return s
  })
}
