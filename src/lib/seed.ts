import type { PersistedData, Program, Profile } from '../types'
import { uid } from './id'

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
          { id: uid(), name: 'Barbell Bench Press', targetSets: 4, targetReps: '6-8' },
          { id: uid(), name: 'Overhead Press', targetSets: 3, targetReps: '8-10' },
          { id: uid(), name: 'Incline Dumbbell Press', targetSets: 3, targetReps: '8-12' },
          { id: uid(), name: 'Lateral Raise', targetSets: 3, targetReps: '12-15' },
          { id: uid(), name: 'Triceps Pushdown', targetSets: 3, targetReps: '10-15' },
        ],
      },
      {
        id: uid(),
        name: 'Day B — Pull',
        exercises: [
          { id: uid(), name: 'Deadlift', targetSets: 3, targetReps: '5' },
          { id: uid(), name: 'Pull-Up', targetSets: 3, targetReps: '6-10' },
          { id: uid(), name: 'Barbell Row', targetSets: 3, targetReps: '8-10' },
          { id: uid(), name: 'Face Pull', targetSets: 3, targetReps: '12-15' },
          { id: uid(), name: 'Barbell Curl', targetSets: 3, targetReps: '8-12' },
        ],
      },
      {
        id: uid(),
        name: 'Day C — Legs',
        exercises: [
          { id: uid(), name: 'Back Squat', targetSets: 4, targetReps: '6-8' },
          { id: uid(), name: 'Romanian Deadlift', targetSets: 3, targetReps: '8-10' },
          { id: uid(), name: 'Leg Press', targetSets: 3, targetReps: '10-12' },
          { id: uid(), name: 'Leg Curl', targetSets: 3, targetReps: '10-15' },
          { id: uid(), name: 'Standing Calf Raise', targetSets: 4, targetReps: '12-20' },
        ],
      },
    ],
  }
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
    version: 1,
  }
}

export const ACCENT_COLORS = ACCENTS
