import type { PersistedData, Program, Profile } from '../types'
import { uid } from './id'
import { DEFAULT_MUSCLE_TARGETS } from './muscles'
import { resolveMuscles } from './exerciseLibrary'

/** Build a program exercise, auto-attaching its muscle map from the library. */
function ex(name: string, targetSets: number, targetReps: string) {
  return { id: uid(), name, targetSets, targetReps, muscles: resolveMuscles(name) }
}

/**
 * A sensible starter program: a 3-day Push / Pull / Legs rotation.
 * Everything here is fully editable in the app — it's just so the app
 * isn't empty the first time you open it.
 */
export function defaultProgram(): Program {
  return {
    id: uid(),
    name: 'Push / Pull / Legs',
    days: [
      {
        id: uid(),
        name: 'Day A — Push',
        exercises: [
          ex('Barbell Bench Press', 4, '6-8'),
          ex('Overhead Press', 3, '8-10'),
          ex('Incline Dumbbell Press', 3, '8-12'),
          ex('Lateral Raise', 3, '12-15'),
          ex('Triceps Pushdown', 3, '10-15'),
        ],
      },
      {
        id: uid(),
        name: 'Day B — Pull',
        exercises: [
          ex('Deadlift', 3, '5'),
          ex('Pull-Up', 3, '6-10'),
          ex('Barbell Row', 3, '8-10'),
          ex('Face Pull', 3, '12-15'),
          ex('Barbell Curl', 3, '8-12'),
        ],
      },
      {
        id: uid(),
        name: 'Day C — Legs',
        exercises: [
          ex('Back Squat', 4, '6-8'),
          ex('Romanian Deadlift', 3, '8-10'),
          ex('Leg Press', 3, '10-12'),
          ex('Leg Curl', 3, '10-15'),
          ex('Standing Calf Raise', 4, '12-20'),
        ],
      },
    ],
  }
}

export const DEFAULT_PREFS = {
  restSeconds: 120,
  barWeightLb: 45,
  barWeightKg: 20,
}

const ACCENTS = ['#38bdf8', '#f472b6', '#34d399', '#fbbf24', '#a78bfa', '#fb7185']

export function makeProfile(name: string, index = 0): Profile {
  return {
    id: uid(),
    name,
    unit: 'lb',
    color: ACCENTS[index % ACCENTS.length],
  }
}

/** The initial data the app starts with on a brand-new device. */
export function seedData(): PersistedData {
  const me = makeProfile('Me', 0)
  return {
    profiles: [me],
    activeProfileId: me.id,
    program: defaultProgram(),
    sessions: [],
    body: [],
    measurementFields: ['Waist', 'Chest', 'Arms', 'Thighs'],
    exerciseLibrary: {},
    muscleTargets: { ...DEFAULT_MUSCLE_TARGETS },
    prefs: { ...DEFAULT_PREFS },
    version: 5,
  }
}

export const ACCENT_COLORS = ACCENTS
