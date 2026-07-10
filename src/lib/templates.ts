import type { Exercise, MuscleId, Program } from '../types'
import { uid } from './id'
import { resolveMuscles } from './exerciseLibrary'
import { defaultProgram } from './seed'

// ---------------------------------------------------------------------------
// Program templates. Applying one REPLACES the current program (logged history
// is never touched). Two styles:
//   - named: classic templates with concrete exercises
//   - slots: structure-first templates (RP-style) — each entry is a muscle
//     focus; you pick the exact exercise later, even mid-workout.
// ---------------------------------------------------------------------------

function named(name: string, targetSets: number, targetReps: string): Exercise {
  return { id: uid(), name, targetSets, targetReps, muscles: resolveMuscles(name) }
}

function slot(slotMuscle: MuscleId, targetSets = 3, targetReps = '8-12'): Exercise {
  // Until an exercise is chosen, credit the focus muscle in full so logged
  // work still counts toward weekly volume.
  return { id: uid(), name: '', targetSets, targetReps, slotMuscle, muscles: { [slotMuscle]: 1 } }
}

export interface ProgramTemplate {
  id: string
  name: string
  description: string
  build: () => Program
}

export const TEMPLATES: ProgramTemplate[] = [
  {
    id: 'ppl',
    name: 'Push / Pull / Legs (3-day)',
    description: 'The classic rotation with proven exercises picked for you.',
    build: defaultProgram,
  },
  {
    id: 'upper-lower',
    name: 'Upper / Lower (4-day)',
    description: 'Two upper and two lower days — great at 4 sessions a week.',
    build: () => ({
      id: uid(),
      name: 'Upper / Lower',
      days: [
        {
          id: uid(),
          name: 'Upper A',
          exercises: [
            named('Barbell Bench Press', 4, '6-8'),
            named('Barbell Row', 4, '8-10'),
            named('Overhead Press', 3, '8-10'),
            named('Lat Pulldown', 3, '10-12'),
            named('Lateral Raise', 3, '12-15'),
            named('Barbell Curl', 3, '8-12'),
          ],
        },
        {
          id: uid(),
          name: 'Lower A',
          exercises: [
            named('Back Squat', 4, '6-8'),
            named('Romanian Deadlift', 3, '8-10'),
            named('Leg Press', 3, '10-12'),
            named('Leg Curl', 3, '10-15'),
            named('Standing Calf Raise', 4, '12-20'),
            named('Cable Crunch', 3, '10-15'),
          ],
        },
        {
          id: uid(),
          name: 'Upper B',
          exercises: [
            named('Overhead Press', 4, '6-8'),
            named('Pull-Up', 3, '6-10'),
            named('Incline Dumbbell Press', 3, '8-12'),
            named('Seated Cable Row', 3, '10-12'),
            named('Face Pull', 3, '12-15'),
            named('Skullcrusher', 3, '10-12'),
          ],
        },
        {
          id: uid(),
          name: 'Lower B',
          exercises: [
            named('Deadlift', 3, '5'),
            named('Front Squat', 3, '8-10'),
            named('Bulgarian Split Squat', 3, '8-12'),
            named('Leg Extension', 3, '10-15'),
            named('Seated Calf Raise', 4, '12-20'),
            named('Hanging Leg Raise', 3, '10-15'),
          ],
        },
      ],
    }),
  },
  {
    id: 'full-body',
    name: 'Full Body (3-day)',
    description: 'Hit everything each session — efficient at 3 days a week.',
    build: () => ({
      id: uid(),
      name: 'Full Body',
      days: [
        {
          id: uid(),
          name: 'Full Body A',
          exercises: [
            named('Back Squat', 3, '6-8'),
            named('Barbell Bench Press', 3, '6-8'),
            named('Barbell Row', 3, '8-10'),
            named('Lateral Raise', 3, '12-15'),
            named('Plank', 3, '30-60'),
          ],
        },
        {
          id: uid(),
          name: 'Full Body B',
          exercises: [
            named('Deadlift', 3, '5'),
            named('Overhead Press', 3, '8-10'),
            named('Lat Pulldown', 3, '10-12'),
            named('Leg Curl', 3, '10-15'),
            named('Barbell Curl', 3, '8-12'),
          ],
        },
        {
          id: uid(),
          name: 'Full Body C',
          exercises: [
            named('Leg Press', 3, '10-12'),
            named('Incline Dumbbell Press', 3, '8-12'),
            named('Seated Cable Row', 3, '10-12'),
            named('Romanian Deadlift', 3, '8-10'),
            named('Standing Calf Raise', 3, '12-20'),
          ],
        },
      ],
    }),
  },
  {
    id: 'body-part-6',
    name: 'Body-Part Focus (6-day, slots)',
    description:
      'Structure first, RP-style: each day is a list of muscle slots — decide your volume now, pick the exact exercises later (even mid-workout).',
    build: () => ({
      id: uid(),
      name: 'Body-Part Focus',
      days: [
        {
          id: uid(),
          name: 'Day 1 — Lower Focus',
          exercises: [slot('quads'), slot('quads'), slot('hamstrings'), slot('sideDelts'), slot('calves', 3, '12-20'), slot('abs', 3, '10-15')],
        },
        {
          id: uid(),
          name: 'Day 2 — Push Focus',
          exercises: [slot('chest'), slot('chest'), slot('triceps'), slot('sideDelts', 3, '12-15'), slot('upperBack'), slot('abs', 3, '10-15')],
        },
        {
          id: uid(),
          name: 'Day 3 — Pull Focus',
          exercises: [slot('lats'), slot('lats'), slot('upperBack'), slot('rearDelts', 3, '12-15'), slot('biceps'), slot('forearms', 2, '10-15')],
        },
        {
          id: uid(),
          name: 'Day 4 — Hamstring Focus',
          exercises: [slot('hamstrings'), slot('hamstrings'), slot('quads'), slot('glutes'), slot('calves', 3, '12-20'), slot('abs', 3, '10-15')],
        },
        {
          id: uid(),
          name: 'Day 5 — Chest & Arms',
          exercises: [slot('chest'), slot('chest'), slot('sideDelts', 3, '12-15'), slot('triceps'), slot('triceps'), slot('abs', 3, '10-15')],
        },
        {
          id: uid(),
          name: 'Day 6 — Back & Arms',
          exercises: [slot('lats'), slot('upperBack'), slot('rearDelts', 3, '12-15'), slot('biceps'), slot('biceps'), slot('forearms', 2, '10-15')],
        },
      ],
    }),
  },
]
