import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useStore, useActiveProfile } from '../store/useStore'
import { lastPerformance, summarizeSets } from '../lib/history'
import { formatLongDate } from '../lib/date'
import { computePRSet, prKey } from '../lib/pr'
import { muscleName } from '../lib/muscles'
import { EmptyState } from '../components/ui'
import { Stepper } from '../components/Stepper'
import { ExerciseDatalist } from '../components/ExerciseDatalist'
import { ExerciseSlotPicker } from '../components/ExerciseSlotPicker'
import type { LoggedExercise, MuscleId } from '../types'

export function WorkoutPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const profile = useActiveProfile()

  const session = useStore((s) => s.sessions.find((x) => x.id === id))
  const allSessions = useStore((s) => s.sessions)

  // Personal records recompute live as you log, so 🏆 appears the moment you beat one.
  const prs = useMemo(
    () => (profile ? computePRSet(allSessions, profile.id) : new Set<string>()),
    [allSessions, profile],
  )

  const updateSet = useStore((s) => s.updateSet)
  const addSet = useStore((s) => s.addSet)
  const removeSet = useStore((s) => s.removeSet)
  const addExerciseToSession = useStore((s) => s.addExerciseToSession)
  const fillSessionSlot = useStore((s) => s.fillSessionSlot)
  const setExerciseNotes = useStore((s) => s.setExerciseNotes)
  const setSessionNotes = useStore((s) => s.setSessionNotes)
  const setSessionDate = useStore((s) => s.setSessionDate)
  const finishSession = useStore((s) => s.finishSession)
  const deleteSession = useStore((s) => s.deleteSession)

  const [newExercise, setNewExercise] = useState('')

  if (!session) {
    return (
      <EmptyState icon="🤔" title="Workout not found">
        It may have been deleted. <button className="text-sky-400 underline" onClick={() => navigate('/')}>Go home</button>
      </EmptyState>
    )
  }

  const completedSets = session.exercises.reduce(
    (n, ex) => n + ex.sets.filter((s) => s.done).length,
    0,
  )
  const totalSets = session.exercises.reduce((n, ex) => n + ex.sets.length, 0)

  function handleFinish() {
    finishSession(session!.id)
    navigate('/progress')
  }

  function handleDelete() {
    if (confirm('Delete this entire workout? This cannot be undone.')) {
      deleteSession(session!.id)
      navigate('/')
    }
  }

  function handleAddExercise() {
    const name = newExercise.trim()
    if (!name) return
    addExerciseToSession(session!.id, name)
    setNewExercise('')
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-2xl font-bold tracking-tight">{session.dayName}</h1>
          <span
            className="rounded-full px-2.5 py-1 text-xs font-semibold"
            style={{ backgroundColor: (profile?.color ?? '#38bdf8') + '22', color: profile?.color }}
          >
            {profile?.name}
          </span>
        </div>
        <div className="mt-2 flex items-center gap-2 text-sm text-slate-400">
          <label htmlFor="session-date">Date</label>
          <input
            id="session-date"
            type="date"
            value={session.date}
            onChange={(e) => setSessionDate(session.id, e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-800 px-2 py-1 text-slate-100"
          />
          <span className="ml-auto">
            {completedSets}/{totalSets} sets
          </span>
        </div>
      </div>

      {/* Exercises */}
      {session.exercises.length === 0 && (
        <EmptyState icon="➕" title="No exercises">
          Add an exercise below to start logging.
        </EmptyState>
      )}

      {session.exercises.map((ex, exIndex) =>
        !ex.name.trim() && ex.slotMuscle ? (
          <SlotCard
            key={ex.exerciseId + exIndex}
            muscleId={ex.slotMuscle}
            sets={ex.sets.length}
            targetReps={ex.targetReps}
            onPick={(name) => fillSessionSlot(session.id, exIndex, name)}
          />
        ) : (
          <ExerciseCard
            key={ex.exerciseId + exIndex}
            ex={ex}
            last={lastPerformance(allSessions, session.profileId, ex.name, session.id)}
            unit={profile?.unit ?? 'lb'}
            isPR={prs.has(prKey(session.id, exIndex))}
            onSetChange={(setId, patch) => updateSet(session.id, exIndex, setId, patch)}
            onAddSet={() => addSet(session.id, exIndex)}
            onRemoveSet={(setId) => removeSet(session.id, exIndex, setId)}
            onNotes={(notes) => setExerciseNotes(session.id, exIndex, notes)}
          />
        ),
      )}

      {/* Add extra exercise */}
      <ExerciseDatalist id="workout-lib-exercises" />
      <div className="card flex items-center gap-2 p-3">
        <input
          className="input"
          list="workout-lib-exercises"
          placeholder="Add another exercise…"
          value={newExercise}
          onChange={(e) => setNewExercise(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAddExercise()}
        />
        <button className="btn-ghost shrink-0" onClick={handleAddExercise}>
          Add
        </button>
      </div>

      {/* Session notes */}
      <div className="card p-4">
        <label className="label" htmlFor="session-notes">
          Workout notes
        </label>
        <textarea
          id="session-notes"
          className="input min-h-20 resize-y"
          placeholder="How did it feel? Anything to remember for next time?"
          value={session.notes ?? ''}
          onChange={(e) => setSessionNotes(session.id, e.target.value)}
        />
      </div>

      {/* Actions */}
      <div className="space-y-2">
        {session.completedAt ? (
          <div className="card px-4 py-3 text-center text-sm text-emerald-400">
            ✓ Completed workout from {formatLongDate(session.date)}. Edits save automatically.
          </div>
        ) : (
          <button className="btn-primary w-full py-3 text-base" onClick={handleFinish}>
            Finish workout ✓
          </button>
        )}
        <button className="btn-danger w-full" onClick={handleDelete}>
          Delete workout
        </button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------

/** An unfilled muscle slot: choose the exercise now, based on what's free. */
function SlotCard({
  muscleId,
  sets,
  targetReps,
  onPick,
}: {
  muscleId: MuscleId
  sets: number
  targetReps?: string
  onPick: (name: string) => void
}) {
  return (
    <div className="card border-dashed border-sky-500/40 p-4">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-lg font-bold">🎯 {muscleName(muscleId)}</h3>
        <span className="text-xs text-slate-400">
          {sets} set{sets === 1 ? '' : 's'}
          {targetReps ? ` × ${targetReps}` : ''}
        </span>
      </div>
      <p className="mt-1 text-xs text-slate-400">
        Pick any {muscleName(muscleId).toLowerCase()} exercise — whatever equipment is free. Your
        targets and history kick in once you choose.
      </p>
      <div className="mt-3">
        <ExerciseSlotPicker muscleId={muscleId} value="" onPick={onPick} />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------

function ExerciseCard({
  ex,
  last,
  unit,
  isPR,
  onSetChange,
  onAddSet,
  onRemoveSet,
  onNotes,
}: {
  ex: LoggedExercise
  last: { date: string; exercise: LoggedExercise } | null
  unit: string
  isPR: boolean
  onSetChange: (
    setId: string,
    patch: { reps?: number | null; weight?: number | null; done?: boolean; rir?: number | null },
  ) => void
  onAddSet: () => void
  onRemoveSet: (setId: string) => void
  onNotes: (notes: string) => void
}) {
  const [showNotes, setShowNotes] = useState(!!ex.notes)
  const [showRIR, setShowRIR] = useState(() => ex.sets.some((s) => s.rir != null))
  const weightStep = unit === 'kg' ? 2.5 : 5

  const grid = showRIR
    ? 'grid grid-cols-[1.5rem_1fr_1fr_2.75rem_2.25rem_1.25rem] items-center gap-1.5'
    : 'grid grid-cols-[1.5rem_1fr_1fr_2.25rem_1.25rem] items-center gap-1.5'

  const muscleHint = Object.entries(ex.muscles ?? {})
    .filter(([, v]) => v > 0)
    .map(([id, v]) => `${muscleName(id)} ${v === 1 ? '1' : '½'}`)
    .join(' · ')

  const suggestion = ex.suggestion

  return (
    <div className="card p-4">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="flex items-center gap-1.5 text-lg font-bold">
          {ex.name}
          {isPR && <span title="New personal record">🏆</span>}
        </h3>
        {ex.targetReps && <span className="text-xs text-slate-400">target {ex.targetReps} reps</span>}
      </div>

      {muscleHint && <div className="mt-0.5 text-xs text-slate-500">{muscleHint}</div>}

      {/* The coach's prescription for this session */}
      {suggestion && suggestion.action !== 'baseline' && (
        <div className="mt-2 rounded-lg border border-sky-500/30 bg-sky-500/10 px-3 py-2 text-xs">
          <span className="font-semibold text-sky-300">
            🎯 Target: {suggestion.weight != null ? `${suggestion.weight} ${unit} × ` : ''}
            {suggestion.reps} reps
          </span>
          <span className="ml-1 text-slate-400">— {suggestion.note}</span>
        </div>
      )}
      {suggestion && suggestion.action === 'baseline' && (
        <div className="mt-2 rounded-lg border border-slate-600/50 bg-slate-700/20 px-3 py-2 text-xs text-slate-400">
          🎯 {suggestion.note}
        </div>
      )}

      {last && (
        <div className="mt-1 text-xs text-slate-400">
          Last time: <span className="text-slate-300">{summarizeSets(last.exercise)}</span>
        </div>
      )}

      {/* Column headers */}
      <div className={`mt-3 ${grid} text-[11px] uppercase tracking-wide text-slate-500`}>
        <span>Set</span>
        <span className="pl-2">{unit}</span>
        <span className="pl-2">Reps</span>
        {showRIR && <span className="text-center">RIR</span>}
        <span className="text-center">Done</span>
        <span />
      </div>

      <div className="mt-1 space-y-1.5">
        {ex.sets.map((s, i) => (
          <div key={s.id} className={grid}>
            <span className="text-center text-sm font-semibold text-slate-400">{i + 1}</span>
            <Stepper
              value={s.weight}
              step={weightStep}
              ariaLabel="weight"
              onChange={(v) => onSetChange(s.id, { weight: v })}
            />
            <Stepper
              value={s.reps}
              step={1}
              ariaLabel="reps"
              onChange={(v) => onSetChange(s.id, { reps: v })}
            />
            {showRIR && (
              <select
                aria-label="Reps in reserve"
                value={s.rir ?? ''}
                onChange={(e) =>
                  onSetChange(s.id, { rir: e.target.value === '' ? null : Number(e.target.value) })
                }
                className="h-9 w-full rounded-lg border border-slate-700 bg-slate-900/70 text-center text-sm text-slate-100 outline-none focus:border-sky-500"
              >
                <option value="">–</option>
                {[0, 1, 2, 3, 4].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            )}
            <button
              aria-label={s.done ? 'Mark set not done' : 'Mark set done'}
              onClick={() => onSetChange(s.id, { done: !s.done })}
              className={`mx-auto flex h-9 w-9 items-center justify-center rounded-lg border text-lg transition ${
                s.done
                  ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400'
                  : 'border-slate-600 text-slate-500'
              }`}
            >
              {s.done ? '✓' : ''}
            </button>
            <button
              aria-label="Remove set"
              onClick={() => onRemoveSet(s.id)}
              className="text-slate-500 hover:text-rose-400"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-center gap-2">
        <button className="btn-ghost flex-1 py-2 text-sm" onClick={onAddSet}>
          + Add set
        </button>
        <button
          className={`btn-ghost py-2 text-sm ${showRIR ? 'text-sky-300' : ''}`}
          title="Log reps-in-reserve (how many more reps you had)"
          onClick={() => setShowRIR((v) => !v)}
        >
          RIR
        </button>
        <button
          className="btn-ghost py-2 text-sm"
          onClick={() => setShowNotes((v) => !v)}
        >
          {showNotes ? 'Hide note' : 'Note'}
        </button>
      </div>

      {showNotes && (
        <textarea
          className="input mt-2 min-h-16 resize-y text-sm"
          placeholder="Notes for this exercise (form cues, machine setting…)"
          value={ex.notes ?? ''}
          onChange={(e) => onNotes(e.target.value)}
        />
      )}
    </div>
  )
}
