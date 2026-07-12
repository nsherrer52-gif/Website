import { useMemo } from 'react'
import { useStore } from '../store/useStore'
import { exercisesForMuscle } from '../lib/exerciseLibrary'
import { muscleName } from '../lib/muscles'
import type { MuscleId } from '../types'

const CUSTOM = '__custom__'

/**
 * Dropdown for filling a muscle slot with a concrete exercise. Options come
 * from the library filtered to that muscle (half-set movers marked with ½);
 * "Custom…" lets you type any exercise name.
 */
export function ExerciseSlotPicker({
  muscleId,
  value,
  onPick,
}: {
  muscleId: MuscleId
  value: string
  onPick: (name: string) => void
}) {
  const library = useStore((s) => s.exerciseLibrary)
  const customNames = useStore((s) => s.customExercises)
  const options = useMemo(
    () => exercisesForMuscle(muscleId, library, customNames),
    [muscleId, library, customNames],
  )
  const inList = options.some((o) => o.name === value)

  function handle(v: string) {
    if (v === CUSTOM) {
      const name = prompt(`Custom ${muscleName(muscleId)} exercise:`)?.trim()
      if (name) onPick(name)
      return
    }
    if (v) onPick(v)
  }

  return (
    <select
      aria-label={`Choose ${muscleName(muscleId)} exercise`}
      className="input flex-1"
      value={inList || !value ? value : value /* keep custom name selected */}
      onChange={(e) => handle(e.target.value)}
    >
      {!value && <option value="">Choose exercise…</option>}
      {value && !inList && <option value={value}>{value}</option>}
      {options.map((o) => (
        <option key={o.name} value={o.name}>
          {o.name}
          {o.value < 1 ? ' (½)' : ''}
        </option>
      ))}
      <option value={CUSTOM}>Custom…</option>
    </select>
  )
}
