import type { MuscleContribution } from '../types'

// ---------------------------------------------------------------------------
// Built-in mapping of common exercises -> muscle contributions.
// 1.0 = full set for that muscle, 0.5 = a half / assisting set.
// Users can override or extend this (stored in PersistedData.exerciseLibrary).
// ---------------------------------------------------------------------------

/** Normalize an exercise name so lookups are case/spacing insensitive. */
export function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, ' ')
}

// Authoring list keyed by readable names; normalized into DEFAULT_LIBRARY below.
const RAW: Record<string, MuscleContribution> = {
  // --- Push: chest ---
  'Barbell Bench Press': { chest: 1, frontDelts: 0.5, triceps: 0.5 },
  'Incline Barbell Bench Press': { chest: 1, frontDelts: 0.5, triceps: 0.5 },
  'Incline Dumbbell Press': { chest: 1, frontDelts: 0.5, triceps: 0.5 },
  'Dumbbell Bench Press': { chest: 1, frontDelts: 0.5, triceps: 0.5 },
  'Push-Up': { chest: 1, frontDelts: 0.5, triceps: 0.5 },
  'Chest Fly': { chest: 1 },
  'Cable Fly': { chest: 1 },
  'Pec Deck': { chest: 1 },
  'Dips': { triceps: 1, chest: 0.5, frontDelts: 0.5 },
  'Close-Grip Bench Press': { triceps: 1, chest: 0.5, frontDelts: 0.5 },

  // --- Push: shoulders / triceps ---
  'Overhead Press': { frontDelts: 1, sideDelts: 0.5, triceps: 0.5 },
  'Military Press': { frontDelts: 1, sideDelts: 0.5, triceps: 0.5 },
  'Dumbbell Shoulder Press': { frontDelts: 1, sideDelts: 0.5, triceps: 0.5 },
  'Arnold Press': { frontDelts: 1, sideDelts: 0.5, triceps: 0.5 },
  'Lateral Raise': { sideDelts: 1 },
  'Front Raise': { frontDelts: 1 },
  'Triceps Pushdown': { triceps: 1 },
  'Overhead Triceps Extension': { triceps: 1 },
  'Skullcrusher': { triceps: 1 },

  // --- Pull: back ---
  'Deadlift': { hamstrings: 1, glutes: 1, spinalErectors: 1, lats: 0.5, upperBack: 0.5, traps: 0.5, forearms: 0.5 },
  'Pull-Up': { lats: 1, upperBack: 0.5, biceps: 0.5, forearms: 0.5 },
  'Chin-Up': { lats: 1, biceps: 1, upperBack: 0.5 },
  'Lat Pulldown': { lats: 1, upperBack: 0.5, biceps: 0.5 },
  'Barbell Row': { lats: 1, upperBack: 1, biceps: 0.5, rearDelts: 0.5 },
  'Bent-Over Row': { lats: 1, upperBack: 1, biceps: 0.5, rearDelts: 0.5 },
  'Dumbbell Row': { lats: 1, upperBack: 0.5, biceps: 0.5 },
  'Seated Cable Row': { lats: 1, upperBack: 1, biceps: 0.5 },
  'T-Bar Row': { lats: 1, upperBack: 1, biceps: 0.5 },
  'Face Pull': { rearDelts: 1, upperBack: 0.5, traps: 0.5 },
  'Reverse Fly': { rearDelts: 1, upperBack: 0.5 },
  'Shrug': { traps: 1, forearms: 0.5 },
  'Rack Pull': { traps: 1, spinalErectors: 1, hamstrings: 0.5, glutes: 0.5, forearms: 0.5 },
  'Back Extension': { spinalErectors: 1, glutes: 0.5, hamstrings: 0.5 },
  'Hyperextension': { spinalErectors: 1, glutes: 0.5, hamstrings: 0.5 },
  'Superman': { spinalErectors: 1 },
  'Neck Curl': { neck: 1 },
  'Neck Extension': { neck: 1 },

  // --- Pull: biceps / forearms ---
  'Barbell Curl': { biceps: 1, forearms: 0.5 },
  'Dumbbell Curl': { biceps: 1, forearms: 0.5 },
  'Hammer Curl': { biceps: 1, forearms: 1 },
  'Preacher Curl': { biceps: 1 },
  'Cable Curl': { biceps: 1 },
  'Wrist Curl': { forearms: 1 },

  // --- Legs ---
  'Back Squat': { quads: 1, glutes: 1, hamstrings: 0.5, spinalErectors: 0.5 },
  'Front Squat': { quads: 1, glutes: 0.5, spinalErectors: 0.5 },
  'Leg Press': { quads: 1, glutes: 0.5, hamstrings: 0.5 },
  'Hack Squat': { quads: 1, glutes: 0.5 },
  'Bulgarian Split Squat': { quads: 1, glutes: 1, hamstrings: 0.5 },
  'Lunge': { quads: 1, glutes: 1, hamstrings: 0.5 },
  'Leg Extension': { quads: 1 },
  'Leg Curl': { hamstrings: 1 },
  'Romanian Deadlift': { hamstrings: 1, glutes: 1, spinalErectors: 0.5, lats: 0.5 },
  'Stiff-Leg Deadlift': { hamstrings: 1, glutes: 1, spinalErectors: 0.5 },
  'Hip Thrust': { glutes: 1, hamstrings: 0.5 },
  'Good Morning': { hamstrings: 1, glutes: 0.5, spinalErectors: 1 },
  'Standing Calf Raise': { calves: 1 },
  'Seated Calf Raise': { calves: 1 },
  'Calf Raise': { calves: 1 },

  // --- Core ---
  'Plank': { abs: 1 },
  'Crunch': { abs: 1 },
  'Cable Crunch': { abs: 1 },
  'Hanging Leg Raise': { abs: 1 },
  'Leg Raise': { abs: 1 },
  'Sit-Up': { abs: 1 },
  'Ab Wheel': { abs: 1 },
}

export const DEFAULT_LIBRARY: Record<string, MuscleContribution> = Object.fromEntries(
  Object.entries(RAW).map(([name, muscles]) => [normalizeName(name), muscles]),
)

/** The built-in exercises with their display names, for pickers/autocomplete. */
export interface LibraryExercise {
  name: string
  muscles: MuscleContribution
}

export const LIBRARY_EXERCISES: LibraryExercise[] = Object.entries(RAW).map(
  ([name, muscles]) => ({ name, muscles }),
)

function titleCase(normalized: string): string {
  return normalized.replace(/\b\w/g, (c) => c.toUpperCase())
}

/**
 * Exercises that train a muscle with at least a half-set credit, for filling a
 * muscle slot. Includes user library overrides. Full-credit movers sort first.
 */
export function exercisesForMuscle(
  muscleId: string,
  libraryOverrides?: Record<string, MuscleContribution>,
  displayNames?: Record<string, string>,
): { name: string; value: number }[] {
  const out = new Map<string, { name: string; value: number }>()
  for (const ex of LIBRARY_EXERCISES) {
    const v = ex.muscles[muscleId] ?? 0
    if (v >= 0.5) out.set(normalizeName(ex.name), { name: ex.name, value: v })
  }
  for (const [key, muscles] of Object.entries(libraryOverrides ?? {})) {
    const v = muscles[muscleId] ?? 0
    if (v >= 0.5) {
      out.set(key, { name: out.get(key)?.name ?? displayNames?.[key] ?? titleCase(key), value: v })
    } else out.delete(key) // an override that dropped this muscle wins over the default
  }
  return [...out.values()].sort((a, b) => b.value - a.value || a.name.localeCompare(b.name))
}

/** True when a name matches one of the built-in library exercises. */
export function isBuiltIn(name: string): boolean {
  return normalizeName(name) in DEFAULT_LIBRARY
}

/** True if a contribution map has at least one muscle with a non-zero value. */
export function hasMuscles(m: MuscleContribution | undefined): boolean {
  return !!m && Object.values(m).some((v) => v > 0)
}

/**
 * Resolve the muscle map for an exercise. Precedence:
 *   explicit per-exercise override → user library override → built-in default → {}.
 */
export function resolveMuscles(
  name: string,
  override?: MuscleContribution,
  libraryOverrides?: Record<string, MuscleContribution>,
): MuscleContribution {
  if (hasMuscles(override)) return override!
  const key = normalizeName(name)
  if (libraryOverrides && hasMuscles(libraryOverrides[key])) return libraryOverrides[key]
  if (hasMuscles(DEFAULT_LIBRARY[key])) return DEFAULT_LIBRARY[key]
  return {}
}
