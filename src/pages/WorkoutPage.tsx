import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useStore, useActiveProfile } from '../store/useStore'
import { lastPerformance, summarizeSets } from '../lib/history'
import { formatLongDate } from '../lib/date'
import { EmptyState } from '../components/ui'
import type { LoggedExercise } from '../types'

export function WorkoutPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const profile = useActiveProfile()

  const session = useStore((s) => s.sessions.find((x) => x.id === id))
  const allSessions = useStore((s) => s.sessions)

  const updateSet = useStore((s) => s.updateSet)
  const addSet = useStore((s) => s.addSet)
  const removeSet = useStore((s) => s.removeSet)
  const addExerciseToSession = useStore((s) => s.addExerciseToSession)
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

  function num(v: string): number | null {
    if (v.trim() === '') return null
    const n = Number(v)
    return Number.isFinite(n) ? n : null
  }

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

      {session.exercises.map((ex, exIndex) => (
        <ExerciseCard
          key={ex.exerciseId + exIndex}
          ex={ex}
          last={lastPerformance(allSessions, session.profileId, ex.name, session.id)}
          unit={profile?.unit ?? 'lb'}
          onSetChange={(setId, patch) => updateSet(session.id, exIndex, setId, patch)}
          onAddSet={() => addSet(session.id, exIndex)}
          onRemoveSet={(setId) => removeSet(session.id, exIndex, setId)}
          onNotes={(notes) => setExerciseNotes(session.id, exIndex, notes)}
          parseNum={num}
        />
      ))}

      {/* Add extra exercise */}
      <div className="card flex items-center gap-2 p-3">
        <input
          className="input"
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

function ExerciseCard({
  ex,
  last,
  unit,
  onSetChange,
  onAddSet,
  onRemoveSet,
  onNotes,
  parseNum,
}: {
  ex: LoggedExercise
  last: { date: string; exercise: LoggedExercise } | null
  unit: string
  onSetChange: (setId: string, patch: { reps?: number | null; weight?: number | null; done?: boolean }) => void
  onAddSet: () => void
  onRemoveSet: (setId: string) => void
  onNotes: (notes: string) => void
  parseNum: (v: string) => number | null
}) {
  const [showNotes, setShowNotes] = useState(!!ex.notes)

  return (
    <div className="card p-4">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-lg font-bold">{ex.name}</h3>
        {ex.targetReps && <span className="text-xs text-slate-400">target {ex.targetReps} reps</span>}
      </div>

      {last && (
        <div className="mt-1 text-xs text-slate-400">
          Last time: <span className="text-slate-300">{summarizeSets(last.exercise)}</span>
        </div>
      )}

      {/* Column headers */}
      <div className="mt-3 grid grid-cols-[2rem_1fr_1fr_2.5rem_2rem] items-center gap-2 text-[11px] uppercase tracking-wide text-slate-500">
        <span>Set</span>
        <span>{unit}</span>
        <span>Reps</span>
        <span className="text-center">Done</span>
        <span />
      </div>

      <div className="mt-1 space-y-1.5">
        {ex.sets.map((s, i) => (
          <div
            key={s.id}
            className="grid grid-cols-[2rem_1fr_1fr_2.5rem_2rem] items-center gap-2"
          >
            <span className="text-center text-sm font-semibold text-slate-400">{i + 1}</span>
            <input
              className="input px-2 py-2 text-center"
              type="number"
              inputMode="decimal"
              placeholder="—"
              value={s.weight ?? ''}
              onChange={(e) => onSetChange(s.id, { weight: parseNum(e.target.value) })}
            />
            <input
              className="input px-2 py-2 text-center"
              type="number"
              inputMode="numeric"
              placeholder="—"
              value={s.reps ?? ''}
              onChange={(e) => onSetChange(s.id, { reps: parseNum(e.target.value) })}
            />
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
