import { useMemo } from 'react'
import { useStore } from '../store/useStore'
import { LIBRARY_EXERCISES, normalizeName } from '../lib/exerciseLibrary'

/**
 * A <datalist> of exercise names — the built-in library PLUS every custom
 * exercise you've created (captured automatically). Attach to any text input
 * via list={id}.
 */
export function ExerciseDatalist({ id }: { id: string }) {
  const custom = useStore((s) => s.customExercises)
  const names = useMemo(() => {
    const seen = new Set(LIBRARY_EXERCISES.map((e) => normalizeName(e.name)))
    const all = LIBRARY_EXERCISES.map((e) => e.name)
    for (const [key, name] of Object.entries(custom)) {
      if (!seen.has(key)) all.push(name)
    }
    return all.sort((a, b) => a.localeCompare(b))
  }, [custom])

  return (
    <datalist id={id}>
      {names.map((n) => (
        <option key={n} value={n} />
      ))}
    </datalist>
  )
}
