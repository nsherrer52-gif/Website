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

// --- The program (shared by everyone) --------------------------------------

/** A single exercise as it appears in the program template. */
export interface Exercise {
  id: ID
  name: string
  /** Planned number of working sets, e.g. 3. */
  targetSets: number
  /** Planned rep range as free text, e.g. "8-12" or "5". */
  targetReps: string
  notes?: string
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

export interface PersistedData {
  profiles: Profile[]
  activeProfileId: ID
  program: Program
  sessions: Session[]
  body: BodyEntry[]
  /** Configurable list of body-measurement fields, e.g. ["Waist","Chest"]. */
  measurementFields: string[]
  /** Schema version, so we can migrate old backups if the model changes. */
  version: number
}
