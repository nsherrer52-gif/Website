import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  BodyEntry,
  Exercise,
  ID,
  MuscleContribution,
  MuscleId,
  MuscleTarget,
  PersistedData,
  Prefs,
  Profile,
  Program,
  Session,
  SetEntry,
  WeightUnit,
  WorkoutDay,
} from '../types'
import { uid } from '../lib/id'
import { todayISO } from '../lib/date'
import { DEFAULT_PREFS, makeProfile, seedData } from '../lib/seed'
import { hasMuscles, normalizeName, resolveMuscles } from '../lib/exerciseLibrary'
import { DEFAULT_MUSCLE_TARGETS } from '../lib/muscles'
import { lastPerformance } from '../lib/history'
import { suggestForExercise } from '../lib/progression'

const STORAGE_KEY = 'gym-tracker-v1'

// ---------------------------------------------------------------------------
// Small immutable-update helpers (so we don't need an extra dependency).
// ---------------------------------------------------------------------------

function replaceById<T extends { id: ID }>(arr: T[], id: ID, patch: Partial<T>): T[] {
  return arr.map((item) => (item.id === id ? { ...item, ...patch } : item))
}

function move<T>(arr: T[], index: number, dir: -1 | 1): T[] {
  const target = index + dir
  if (index < 0 || target < 0 || target >= arr.length) return arr
  const copy = [...arr]
  const [item] = copy.splice(index, 1)
  copy.splice(target, 0, item)
  return copy
}

// ---------------------------------------------------------------------------
// Store shape
// ---------------------------------------------------------------------------

interface Actions {
  // Profiles
  addProfile: (name: string) => void
  renameProfile: (id: ID, name: string) => void
  setProfileUnit: (id: ID, unit: WeightUnit) => void
  deleteProfile: (id: ID) => void
  setActiveProfile: (id: ID) => void

  // Program
  setProgramName: (name: string) => void
  /** Replace the whole program (used by templates). Logged history is kept. */
  setProgram: (program: Program) => void
  addDay: (name: string) => void
  renameDay: (dayId: ID, name: string) => void
  deleteDay: (dayId: ID) => void
  moveDay: (dayId: ID, dir: -1 | 1) => void
  addExercise: (dayId: ID, ex: Omit<Exercise, 'id'>) => void
  /** Add a muscle-focus slot; the exercise gets picked later. */
  addSlot: (dayId: ID, muscleId: MuscleId) => void
  /** Choose the concrete exercise for a program slot. */
  fillSlotExercise: (dayId: ID, exId: ID, name: string) => void
  updateExercise: (dayId: ID, exId: ID, patch: Partial<Exercise>) => void
  setExerciseMuscles: (dayId: ID, exId: ID, muscles: MuscleContribution) => void
  deleteExercise: (dayId: ID, exId: ID) => void
  moveExercise: (dayId: ID, exId: ID, dir: -1 | 1) => void

  // Muscle library & targets
  setLibraryMuscles: (name: string, muscles: MuscleContribution) => void
  setMuscleTarget: (id: MuscleId, target: MuscleTarget) => void
  setPrefs: (patch: Partial<Prefs>) => void

  // Sessions
  startSession: (dayId: ID) => ID
  updateSet: (
    sessionId: ID,
    exIndex: number,
    setId: ID,
    patch: Partial<{ reps: number | null; weight: number | null; done: boolean; rir: number | null }>,
  ) => void
  addSet: (sessionId: ID, exIndex: number) => void
  removeSet: (sessionId: ID, exIndex: number, setId: ID) => void
  addExerciseToSession: (sessionId: ID, name: string) => void
  /** Choose the exercise for an unfilled slot in a live session. */
  fillSessionSlot: (sessionId: ID, exIndex: number, name: string) => void
  setExerciseNotes: (sessionId: ID, exIndex: number, notes: string) => void
  setSessionNotes: (sessionId: ID, notes: string) => void
  setSessionDate: (sessionId: ID, date: string) => void
  finishSession: (sessionId: ID) => void
  deleteSession: (sessionId: ID) => void

  // Body tracking
  addBodyEntry: (entry: Omit<BodyEntry, 'id' | 'profileId'>) => void
  updateBodyEntry: (id: ID, patch: Partial<BodyEntry>) => void
  deleteBodyEntry: (id: ID) => void
  addMeasurementField: (name: string) => void
  removeMeasurementField: (name: string) => void

  // Data management
  exportData: () => PersistedData
  importData: (data: PersistedData) => void
  resetAll: () => void
}

export type StoreState = PersistedData & Actions

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      ...seedData(),

      // --- Profiles --------------------------------------------------------
      addProfile: (name) =>
        set((s) => {
          const profile = makeProfile(name.trim() || 'New profile', s.profiles.length)
          return { profiles: [...s.profiles, profile], activeProfileId: profile.id }
        }),

      renameProfile: (id, name) =>
        set((s) => ({ profiles: replaceById(s.profiles, id, { name: name.trim() || 'Unnamed' }) })),

      setProfileUnit: (id, unit) =>
        set((s) => ({ profiles: replaceById(s.profiles, id, { unit }) })),

      deleteProfile: (id) =>
        set((s) => {
          if (s.profiles.length <= 1) return s // keep at least one
          const profiles = s.profiles.filter((p) => p.id !== id)
          return {
            profiles,
            activeProfileId: s.activeProfileId === id ? profiles[0].id : s.activeProfileId,
            sessions: s.sessions.filter((x) => x.profileId !== id),
            body: s.body.filter((x) => x.profileId !== id),
          }
        }),

      setActiveProfile: (id) => set({ activeProfileId: id }),

      // --- Program ---------------------------------------------------------
      setProgramName: (name) =>
        set((s) => ({ program: { ...s.program, name } })),

      setProgram: (program) => set({ program }),

      addDay: (name) =>
        set((s) => {
          const day: WorkoutDay = { id: uid(), name: name.trim() || 'New day', exercises: [] }
          return { program: { ...s.program, days: [...s.program.days, day] } }
        }),

      renameDay: (dayId, name) =>
        set((s) => ({
          program: {
            ...s.program,
            days: replaceById(s.program.days, dayId, { name: name.trim() || 'Untitled day' }),
          },
        })),

      deleteDay: (dayId) =>
        set((s) => ({
          program: { ...s.program, days: s.program.days.filter((d) => d.id !== dayId) },
        })),

      moveDay: (dayId, dir) =>
        set((s) => {
          const idx = s.program.days.findIndex((d) => d.id === dayId)
          return { program: { ...s.program, days: move(s.program.days, idx, dir) } }
        }),

      addExercise: (dayId, ex) =>
        set((s) => {
          // Auto-fill the muscle map from the library when not supplied.
          const muscles = hasMuscles(ex.muscles)
            ? ex.muscles
            : resolveMuscles(ex.name, undefined, s.exerciseLibrary)
          const newEx: Exercise = {
            ...ex,
            id: uid(),
            ...(hasMuscles(muscles) ? { muscles } : {}),
          }
          return {
            program: {
              ...s.program,
              days: s.program.days.map((d) =>
                d.id === dayId ? { ...d, exercises: [...d.exercises, newEx] } : d,
              ),
            },
          }
        }),

      addSlot: (dayId, muscleId) =>
        set((s) => {
          // Credit the focus muscle in full until a specific exercise is chosen.
          const slotEx: Exercise = {
            id: uid(),
            name: '',
            targetSets: 3,
            targetReps: '8-12',
            slotMuscle: muscleId,
            muscles: { [muscleId]: 1 },
          }
          return {
            program: {
              ...s.program,
              days: s.program.days.map((d) =>
                d.id === dayId ? { ...d, exercises: [...d.exercises, slotEx] } : d,
              ),
            },
          }
        }),

      fillSlotExercise: (dayId, exId, name) =>
        set((s) => {
          const clean = name.trim()
          if (!clean) return s
          const resolved = resolveMuscles(clean, undefined, s.exerciseLibrary)
          return {
            program: {
              ...s.program,
              days: s.program.days.map((d) =>
                d.id === dayId
                  ? {
                      ...d,
                      exercises: d.exercises.map((e) =>
                        e.id === exId
                          ? { ...e, name: clean, ...(hasMuscles(resolved) ? { muscles: resolved } : {}) }
                          : e,
                      ),
                    }
                  : d,
              ),
            },
          }
        }),

      updateExercise: (dayId, exId, patch) =>
        set((s) => ({
          program: {
            ...s.program,
            days: s.program.days.map((d) =>
              d.id === dayId ? { ...d, exercises: replaceById(d.exercises, exId, patch) } : d,
            ),
          },
        })),

      setExerciseMuscles: (dayId, exId, muscles) =>
        set((s) => ({
          program: {
            ...s.program,
            days: s.program.days.map((d) =>
              d.id === dayId ? { ...d, exercises: replaceById(d.exercises, exId, { muscles }) } : d,
            ),
          },
        })),

      deleteExercise: (dayId, exId) =>
        set((s) => ({
          program: {
            ...s.program,
            days: s.program.days.map((d) =>
              d.id === dayId ? { ...d, exercises: d.exercises.filter((e) => e.id !== exId) } : d,
            ),
          },
        })),

      moveExercise: (dayId, exId, dir) =>
        set((s) => ({
          program: {
            ...s.program,
            days: s.program.days.map((d) => {
              if (d.id !== dayId) return d
              const idx = d.exercises.findIndex((e) => e.id === exId)
              return { ...d, exercises: move(d.exercises, idx, dir) }
            }),
          },
        })),

      // --- Muscle library & targets ----------------------------------------
      setLibraryMuscles: (name, muscles) =>
        set((s) => {
          const key = normalizeName(name)
          const exerciseLibrary = { ...s.exerciseLibrary }
          if (hasMuscles(muscles)) exerciseLibrary[key] = muscles
          else delete exerciseLibrary[key]
          return { exerciseLibrary }
        }),

      setMuscleTarget: (id, target) =>
        set((s) => ({ muscleTargets: { ...s.muscleTargets, [id]: target } })),

      setPrefs: (patch) => set((s) => ({ prefs: { ...s.prefs, ...patch } })),

      // --- Sessions --------------------------------------------------------
      startSession: (dayId) => {
        const s = get()
        const day = s.program.days.find((d) => d.id === dayId)
        const profile = s.profiles.find((p) => p.id === s.activeProfileId)
        const unit = profile?.unit ?? 'lb'
        const id = uid()
        const session: Session = {
          id,
          profileId: s.activeProfileId,
          dayId,
          dayName: day?.name ?? 'Workout',
          date: todayISO(),
          startedAt: Date.now(),
          exercises: (day?.exercises ?? []).map((ex) => {
            // Prescribe this session's target from the last time this exercise
            // was performed (double progression), and pre-fill the weight.
            // Unfilled muscle slots carry through so the exercise can be
            // chosen mid-workout.
            const named = ex.name.trim().length > 0
            const last = named ? lastPerformance(s.sessions, s.activeProfileId, ex.name) : null
            const suggestion = named
              ? suggestForExercise(last?.exercise ?? null, unit, ex.targetReps)
              : undefined
            return {
              exerciseId: ex.id,
              name: ex.name,
              targetReps: ex.targetReps,
              notes: undefined,
              slotMuscle: ex.slotMuscle,
              // Snapshot the muscle map so weekly volume stays accurate later.
              muscles: resolveMuscles(ex.name, ex.muscles, s.exerciseLibrary),
              suggestion,
              sets: Array.from({ length: Math.max(1, ex.targetSets) }, () => ({
                id: uid(),
                reps: null,
                weight: suggestion?.weight ?? null,
                done: false,
              })),
            }
          }),
        }
        set((st) => ({ sessions: [...st.sessions, session] }))
        return id
      },

      updateSet: (sessionId, exIndex, setId, patch) =>
        set((s) => ({
          sessions: s.sessions.map((sess) => {
            if (sess.id !== sessionId) return sess
            const exercises = sess.exercises.map((ex, i) =>
              i === exIndex ? { ...ex, sets: replaceById<SetEntry>(ex.sets, setId, patch) } : ex,
            )
            return { ...sess, exercises }
          }),
        })),

      addSet: (sessionId, exIndex) =>
        set((s) => ({
          sessions: s.sessions.map((sess) => {
            if (sess.id !== sessionId) return sess
            const exercises = sess.exercises.map((ex, i) => {
              if (i !== exIndex) return ex
              const last = ex.sets[ex.sets.length - 1]
              return {
                ...ex,
                sets: [
                  ...ex.sets,
                  // Carry over the last set's weight as a convenience.
                  { id: uid(), reps: null, weight: last?.weight ?? null, done: false },
                ],
              }
            })
            return { ...sess, exercises }
          }),
        })),

      removeSet: (sessionId, exIndex, setId) =>
        set((s) => ({
          sessions: s.sessions.map((sess) => {
            if (sess.id !== sessionId) return sess
            const exercises = sess.exercises.map((ex, i) =>
              i === exIndex ? { ...ex, sets: ex.sets.filter((x) => x.id !== setId) } : ex,
            )
            return { ...sess, exercises }
          }),
        })),

      addExerciseToSession: (sessionId, name) =>
        set((s) => ({
          sessions: s.sessions.map((sess) =>
            sess.id === sessionId
              ? {
                  ...sess,
                  exercises: [
                    ...sess.exercises,
                    {
                      exerciseId: uid(),
                      name: name.trim() || 'Exercise',
                      muscles: resolveMuscles(name, undefined, s.exerciseLibrary),
                      sets: [{ id: uid(), reps: null, weight: null, done: false }],
                    },
                  ],
                }
              : sess,
          ),
        })),

      fillSessionSlot: (sessionId, exIndex, name) => {
        const s = get()
        const clean = name.trim()
        const sess = s.sessions.find((x) => x.id === sessionId)
        if (!clean || !sess) return
        const profile = s.profiles.find((p) => p.id === sess.profileId)
        const last = lastPerformance(s.sessions, sess.profileId, clean, sessionId)
        const suggestion = suggestForExercise(
          last?.exercise ?? null,
          profile?.unit ?? 'lb',
          sess.exercises[exIndex]?.targetReps,
        )
        const resolved = resolveMuscles(clean, undefined, s.exerciseLibrary)
        set((st) => ({
          sessions: st.sessions.map((x) =>
            x.id !== sessionId
              ? x
              : {
                  ...x,
                  exercises: x.exercises.map((le, i) =>
                    i !== exIndex
                      ? le
                      : {
                          ...le,
                          name: clean,
                          muscles: hasMuscles(resolved) ? resolved : le.muscles,
                          suggestion,
                          sets: le.sets.map((se) =>
                            se.weight == null && !se.done ? { ...se, weight: suggestion.weight } : se,
                          ),
                        },
                  ),
                },
          ),
        }))
      },

      setExerciseNotes: (sessionId, exIndex, notes) =>
        set((s) => ({
          sessions: s.sessions.map((sess) => {
            if (sess.id !== sessionId) return sess
            const exercises = sess.exercises.map((ex, i) => (i === exIndex ? { ...ex, notes } : ex))
            return { ...sess, exercises }
          }),
        })),

      setSessionNotes: (sessionId, notes) =>
        set((s) => ({ sessions: replaceById(s.sessions, sessionId, { notes }) })),

      setSessionDate: (sessionId, date) =>
        set((s) => ({ sessions: replaceById(s.sessions, sessionId, { date }) })),

      finishSession: (sessionId) =>
        set((s) => ({ sessions: replaceById(s.sessions, sessionId, { completedAt: Date.now() }) })),

      deleteSession: (sessionId) =>
        set((s) => ({ sessions: s.sessions.filter((x) => x.id !== sessionId) })),

      // --- Body tracking ---------------------------------------------------
      addBodyEntry: (entry) =>
        set((s) => ({
          body: [...s.body, { ...entry, id: uid(), profileId: s.activeProfileId }],
        })),

      updateBodyEntry: (id, patch) =>
        set((s) => ({ body: replaceById(s.body, id, patch) })),

      deleteBodyEntry: (id) =>
        set((s) => ({ body: s.body.filter((x) => x.id !== id) })),

      addMeasurementField: (name) =>
        set((s) => {
          const clean = name.trim()
          if (!clean || s.measurementFields.includes(clean)) return s
          return { measurementFields: [...s.measurementFields, clean] }
        }),

      removeMeasurementField: (name) =>
        set((s) => ({ measurementFields: s.measurementFields.filter((f) => f !== name) })),

      // --- Data management -------------------------------------------------
      exportData: () => {
        const s = get()
        return {
          profiles: s.profiles,
          activeProfileId: s.activeProfileId,
          program: s.program,
          sessions: s.sessions,
          body: s.body,
          measurementFields: s.measurementFields,
          exerciseLibrary: s.exerciseLibrary,
          muscleTargets: s.muscleTargets,
          prefs: s.prefs,
          version: s.version,
        }
      },

      importData: (data) =>
        set(() => ({
          profiles: data.profiles ?? [],
          activeProfileId: data.activeProfileId ?? data.profiles?.[0]?.id ?? '',
          program: data.program,
          sessions: data.sessions ?? [],
          body: (data.body ?? []).map((b) => ({ ...b, measurements: b.measurements ?? {} })),
          measurementFields: data.measurementFields ?? [],
          // v1 backups won't have these — fall back to defaults.
          exerciseLibrary: data.exerciseLibrary ?? {},
          muscleTargets: data.muscleTargets ?? { ...DEFAULT_MUSCLE_TARGETS },
          prefs: { ...DEFAULT_PREFS, ...(data.prefs ?? {}) },
          version: data.version ?? 5,
        })),

      resetAll: () => set(() => ({ ...seedData() })),
    }),
    {
      name: STORAGE_KEY,
      partialize: (s): PersistedData => ({
        profiles: s.profiles,
        activeProfileId: s.activeProfileId,
        program: s.program,
        sessions: s.sessions,
        body: s.body,
        measurementFields: s.measurementFields,
        exerciseLibrary: s.exerciseLibrary,
        muscleTargets: s.muscleTargets,
        prefs: s.prefs,
        version: s.version,
      }),
    },
  ),
)

// ---------------------------------------------------------------------------
// Convenience selectors (used across pages)
// ---------------------------------------------------------------------------

export function useActiveProfile(): Profile {
  return useStore((s) => s.profiles.find((p) => p.id === s.activeProfileId) ?? s.profiles[0])
}

/** Sessions belonging to the active profile, newest first. */
export function useProfileSessions(): Session[] {
  return useStore((s) =>
    s.sessions
      .filter((x) => x.profileId === s.activeProfileId)
      .sort((a, b) => (b.completedAt ?? b.startedAt) - (a.completedAt ?? a.startedAt)),
  )
}

export type { Program }
