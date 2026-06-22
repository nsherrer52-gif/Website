import { useState } from 'react'
import { useStore } from '../store/useStore'
import { PageHeader, EmptyState } from '../components/ui'
import { MuscleEditor } from '../components/MuscleEditor'
import type { MuscleContribution, WorkoutDay } from '../types'

export function ProgramPage() {
  const program = useStore((s) => s.program)
  const setProgramName = useStore((s) => s.setProgramName)
  const addDay = useStore((s) => s.addDay)

  const [newDay, setNewDay] = useState('')

  function handleAddDay() {
    const name = newDay.trim()
    if (!name) return
    addDay(name)
    setNewDay('')
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Program"
        subtitle="Your rotating split. The app suggests the next day automatically."
      />

      <div className="card p-4">
        <label className="label" htmlFor="program-name">
          Program name
        </label>
        <input
          id="program-name"
          className="input"
          value={program.name}
          onChange={(e) => setProgramName(e.target.value)}
        />
      </div>

      {program.days.length === 0 ? (
        <EmptyState icon="📋" title="No days yet">
          Add your first workout day below (e.g. “Day A — Push”).
        </EmptyState>
      ) : (
        <div className="space-y-3">
          {program.days.map((day, i) => (
            <DayEditor key={day.id} day={day} index={i} total={program.days.length} />
          ))}
        </div>
      )}

      <div className="card flex items-center gap-2 p-3">
        <input
          className="input"
          placeholder="New day name, e.g. Day D — Arms"
          value={newDay}
          onChange={(e) => setNewDay(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAddDay()}
        />
        <button className="btn-primary shrink-0" onClick={handleAddDay}>
          Add day
        </button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------

function DayEditor({ day, index, total }: { day: WorkoutDay; index: number; total: number }) {
  const renameDay = useStore((s) => s.renameDay)
  const deleteDay = useStore((s) => s.deleteDay)
  const moveDay = useStore((s) => s.moveDay)
  const addExercise = useStore((s) => s.addExercise)
  const updateExercise = useStore((s) => s.updateExercise)
  const deleteExercise = useStore((s) => s.deleteExercise)
  const moveExercise = useStore((s) => s.moveExercise)

  const [open, setOpen] = useState(true)
  const [newName, setNewName] = useState('')

  function handleAddExercise() {
    const name = newName.trim()
    if (!name) return
    addExercise(day.id, { name, targetSets: 3, targetReps: '8-12' })
    setNewName('')
  }

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center gap-2 border-b border-slate-700/60 p-3">
        <button
          onClick={() => setOpen((v) => !v)}
          className="text-slate-400"
          aria-label={open ? 'Collapse' : 'Expand'}
        >
          {open ? '▾' : '▸'}
        </button>
        <input
          className="input flex-1 font-semibold"
          value={day.name}
          onChange={(e) => renameDay(day.id, e.target.value)}
        />
        <div className="flex items-center gap-1">
          <button
            className="btn-ghost px-2 py-1.5 text-xs disabled:opacity-30"
            disabled={index === 0}
            onClick={() => moveDay(day.id, -1)}
            aria-label="Move day up"
          >
            ↑
          </button>
          <button
            className="btn-ghost px-2 py-1.5 text-xs disabled:opacity-30"
            disabled={index === total - 1}
            onClick={() => moveDay(day.id, 1)}
            aria-label="Move day down"
          >
            ↓
          </button>
          <button
            className="btn-ghost px-2 py-1.5 text-xs hover:text-rose-400"
            onClick={() => confirm(`Delete "${day.name}"?`) && deleteDay(day.id)}
            aria-label="Delete day"
          >
            🗑
          </button>
        </div>
      </div>

      {open && (
        <div className="space-y-3 p-3">
          {day.exercises.length === 0 && (
            <p className="text-sm text-slate-500">No exercises yet — add one below.</p>
          )}

          {day.exercises.map((ex, exIndex) => (
            <div key={ex.id} className="rounded-xl bg-slate-900/50 p-3">
              <div className="flex items-center gap-2">
                <input
                  className="input flex-1"
                  value={ex.name}
                  onChange={(e) => updateExercise(day.id, ex.id, { name: e.target.value })}
                />
                <button
                  className="px-1.5 text-xs text-slate-500 disabled:opacity-30 hover:text-slate-200"
                  disabled={exIndex === 0}
                  onClick={() => moveExercise(day.id, ex.id, -1)}
                  aria-label="Move exercise up"
                >
                  ↑
                </button>
                <button
                  className="px-1.5 text-xs text-slate-500 disabled:opacity-30 hover:text-slate-200"
                  disabled={exIndex === day.exercises.length - 1}
                  onClick={() => moveExercise(day.id, ex.id, 1)}
                  aria-label="Move exercise down"
                >
                  ↓
                </button>
                <button
                  className="px-1.5 text-slate-500 hover:text-rose-400"
                  onClick={() => deleteExercise(day.id, ex.id)}
                  aria-label="Delete exercise"
                >
                  ✕
                </button>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <div>
                  <label className="label">Sets</label>
                  <input
                    className="input"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    value={ex.targetSets}
                    onChange={(e) =>
                      updateExercise(day.id, ex.id, { targetSets: Math.max(1, Number(e.target.value) || 1) })
                    }
                  />
                </div>
                <div>
                  <label className="label">Reps</label>
                  <input
                    className="input"
                    value={ex.targetReps}
                    placeholder="8-12"
                    onChange={(e) => updateExercise(day.id, ex.id, { targetReps: e.target.value })}
                  />
                </div>
              </div>

              <ExerciseMuscles dayId={day.id} exId={ex.id} name={ex.name} muscles={ex.muscles} />
            </div>
          ))}

          <div className="flex items-center gap-2">
            <input
              className="input"
              placeholder="Add exercise…"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddExercise()}
            />
            <button className="btn-ghost shrink-0" onClick={handleAddExercise}>
              + Add
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------

/** Collapsible muscle-contribution editor for a single program exercise. */
function ExerciseMuscles({
  dayId,
  exId,
  name,
  muscles,
}: {
  dayId: string
  exId: string
  name: string
  muscles?: MuscleContribution
}) {
  const setExerciseMuscles = useStore((s) => s.setExerciseMuscles)
  const setLibraryMuscles = useStore((s) => s.setLibraryMuscles)
  const [open, setOpen] = useState(false)

  const count = Object.values(muscles ?? {}).filter((v) => v > 0).length

  return (
    <div className="mt-2">
      <button
        className="text-xs font-medium text-slate-400 hover:text-slate-200"
        onClick={() => setOpen((v) => !v)}
      >
        {open ? '▾' : '▸'} 🎯 Muscles{count > 0 ? ` (${count})` : ' — not set'}
      </button>
      {open && (
        <div className="mt-2">
          <MuscleEditor
            name={name}
            value={muscles}
            onChange={(m) => setExerciseMuscles(dayId, exId, m)}
            onSaveToLibrary={() => {
              setLibraryMuscles(name, muscles ?? {})
              alert(`Saved "${name}" to your exercise library.`)
            }}
          />
        </div>
      )}
    </div>
  )
}
