import { LIBRARY_EXERCISES } from '../lib/exerciseLibrary'

/**
 * A <datalist> of the built-in exercise names. Attach to any text input via
 * list={id} to get autocomplete that matches the muscle library.
 */
export function ExerciseDatalist({ id }: { id: string }) {
  return (
    <datalist id={id}>
      {LIBRARY_EXERCISES.map((e) => (
        <option key={e.name} value={e.name} />
      ))}
    </datalist>
  )
}
