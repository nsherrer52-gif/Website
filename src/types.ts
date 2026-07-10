// ---------------------------------------------------------------------------
// Data model for the Gym Tracker app.
//
// Everything is stored locally in the browser (see src/store/useStore.ts).
// These types describe the shape of that data. Read this file top-to-bottom
// to understand how the whole app fits together.
// ---------------------------------------------------------------------------

export type ID = string

/** A unit of measure for weight. Each profile picks one. */
export type WeightUnit = 'lb' | 'kg'

/** Identifier for a muscle group, e.g. 'chest', 'triceps' (see src/lib/muscles.ts). */
export type MuscleId = string

/**
 * How much an exercise trains each muscle, as a fraction of a "set".
 * 1.0 = a full working set for that muscle, 0.5 = a half / assisting set.
 * Example (Barbell Bench Press): { chest: 1, triceps: 0.5, frontDelts: 0.5 }.
 */
export type MuscleContribution = Record<MuscleId, number>

// --- The program (shared by everyone) --------------------------------------

/** A single exercise as it appears in the program template. */
export interface Exercise {
  id: ID
  /** Empty string while this entry is an unfilled muscle slot. */
  name: string
  /** Planned number of working sets, e.g. 3. */
  targetSets: number
  /** Planned rep range as free text, e.g. "8-12" or "5". */
  targetReps: string
  notes?: string
  /**
   * Optional per-exercise muscle override. When absent, muscles are resolved by
   * name from the exercise library (see src/lib/exerciseLibrary.ts).
   */
  muscles?: MuscleContribution
  /**
   * When set, this entry began life as a muscle-focus SLOT (structure-first
   * programming, RP-style): you commit to training this muscle for targetSets,
   * and pick the specific exercise later — in the editor or mid-workout.
   */
  slotMuscle?: MuscleId
}

/** One workout in the rotation, e.g. "Day A — Push". */
export interface WorkoutDay {
  id: ID
  name: string
  exercises: Exercise[]
}

/**
 * The training program. In a rotating split the `days` array is the rotation
 * order: after finishing the last day you cycle back to the first.
 */
export interface Program {
  id: ID
  name: string
  days: WorkoutDay[]
}

// --- Logged workouts (per profile) -----------------------------------------

/** One set actually performed during a workout. */
export interface SetEntry {
  id: ID
  reps: number | null
  weight: number | null
  /** Marked complete by tapping the checkbox during the workout. */
  done: boolean
  /**
   * Optional reps-in-reserve: how many more reps you could have done
   * (0 = to failure). Used by the coach to calibrate progression.
   */
  rir?: number | null
}

/**
 * A next-session prescription computed from your history when a workout is
 * started (double progression). Snapshotted onto the logged exercise so the
 * target you trained against is preserved.
 */
export interface ExerciseSuggestion {
  /** Suggested working weight, or null when there's no history yet. */
  weight: number | null
  /** Human-readable rep target, e.g. "8–12" or "9+". */
  reps: string
  /** Short explanation of why, e.g. "You hit the top of your range — add weight." */
  note: string
  action: 'add_weight' | 'add_reps' | 'baseline'
}

/**
 * An exercise as logged in a session. Name is snapshotted at log time so that
 * editing the program later never rewrites your history.
 */
export interface LoggedExercise {
  /** References the program exercise it came from (may no longer exist). */
  exerciseId: ID
  name: string
  targetReps?: string
  sets: SetEntry[]
  notes?: string
  /**
   * Muscle map snapshotted at log time so weekly volume stays accurate even if
   * the program/library changes later. Older (v1) sessions won't have this and
   * fall back to resolving by name.
   */
  muscles?: MuscleContribution
  /** Next-session target computed from history at session start (v3+). */
  suggestion?: ExerciseSuggestion
  /** Carried from a program slot; lets you pick the exercise mid-workout. */
  slotMuscle?: MuscleId
}

/** A complete (or in-progress) workout for one profile on one date. */
export interface Session {
  id: ID
  profileId: ID
  dayId: ID
  dayName: string
  /** ISO date string "YYYY-MM-DD" — the day the workout counts for. */
  date: string
  startedAt: number
  completedAt?: number
  exercises: LoggedExercise[]
  notes?: string
}

// --- Body tracking (per profile) -------------------------------------------

/** A bodyweight + measurements snapshot on a given date. */
export interface BodyEntry {
  id: ID
  profileId: ID
  /** ISO date string "YYYY-MM-DD". */
  date: string
  /** Bodyweight in the profile's unit. */
  weight?: number
  /** Map of measurement field name -> value, e.g. { Waist: 32, Arms: 15 }. */
  measurements: Record<string, number>
  notes?: string
}

// --- Profiles ---------------------------------------------------------------

/** A person using the app. Logs are kept separate per profile. */
export interface Profile {
  id: ID
  name: string
  unit: WeightUnit
  /** Tailwind-ish accent color used in charts/badges. */
  color: string
}

// --- The whole persisted blob ----------------------------------------------

/** A weekly set-count goal range for a muscle, e.g. { min: 10, max: 20 }. */
export interface MuscleTarget {
  min: number
  max: number
}

/** Workout preferences (shared per device). */
export interface Prefs {
  /** Rest timer length in seconds; 0 disables the timer. */
  restSeconds: number
  /** Barbell weight used by the plate calculator, per unit. */
  barWeightLb: number
  barWeightKg: number
}

export interface PersistedData {
  profiles: Profile[]
  activeProfileId: ID
  program: Program
  sessions: Session[]
  body: BodyEntry[]
  /** Configurable list of body-measurement fields, e.g. ["Waist","Chest"]. */
  measurementFields: string[]
  /**
   * User overrides/additions to the built-in exercise library, keyed by
   * normalized exercise name. Merged over the code defaults at read time.
   */
  exerciseLibrary: Record<string, MuscleContribution>
  /** Editable weekly volume goals per muscle. */
  muscleTargets: Record<MuscleId, MuscleTarget>
  /** Rest timer + plate calculator preferences. */
  prefs: Prefs
  /** Schema version, so we can migrate old backups if the model changes. */
  version: number
}
