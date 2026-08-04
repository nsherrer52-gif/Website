import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useStore, useActiveProfile } from '../store/useStore'
import { lastPerformance, recentPerformances, summarizeSets } from '../lib/history'
import { buildSetModel, setTarget } from '../lib/progression'
import { exerciseMomentum } from '../lib/momentum'
import { formatLongDate } from '../lib/date'
import { computePRSet, prKey } from '../lib/pr'
import { muscleName, muscleRegionColor } from '../lib/muscles'
import { EmptyState, PRBadge } from '../components/ui'
import { ExerciseDatalist } from '../components/ExerciseDatalist'
import { ExerciseSlotPicker } from '../components/ExerciseSlotPicker'
import { MuscleTag } from '../components/MuscleTag'
import { RestTimer } from '../components/RestTimer'
import { MomentumBadge } from '../components/MomentumBadge'
import { primeAudio } from '../lib/beep'
import { platesForUnit, platesPerSide, formatPlates } from '../lib/plates'
import { warmupRamp } from '../lib/warmup'
import type { LoggedExercise, MuscleId, WeightUnit } from '../types'

export function WorkoutPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const profile = useActiveProfile()

  const session = useStore((s) => s.sessions.find((x) => x.id === id))
  const allSessions = useStore((s) => s.sessions)

  // Personal records recompute live as you log, so PR appears the moment you beat one.
  const prs = useMemo(
    () => (profile ? computePRSet(allSessions, profile.id) : new Set<string>()),
    [allSessions, profile],
  )

  const updateSet = useStore((s) => s.updateSet)
  const updateSetWeight = useStore((s) => s.updateSetWeight)
  const addSet = useStore((s) => s.addSet)
  const removeSet = useStore((s) => s.removeSet)
  const addExerciseToSession = useStore((s) => s.addExerciseToSession)
  const fillSessionSlot = useStore((s) => s.fillSessionSlot)
  const setExerciseNotes = useStore((s) => s.setExerciseNotes)
  const setSessionNotes = useStore((s) => s.setSessionNotes)
  const setSessionDate = useStore((s) => s.setSessionDate)
  const finishSession = useStore((s) => s.finishSession)
  const deleteSession = useStore((s) => s.deleteSession)

  const prefs = useStore((s) => s.prefs)
  const [newExercise, setNewExercise] = useState('')
  const [restEndsAt, setRestEndsAt] = useState<number | null>(null)

  if (!session) {
    return (
      <EmptyState title="Workout not found">
        It may have been deleted.{' '}
        <button className="text-sky-400 underline" onClick={() => navigate('/')}>
          Go home
        </button>
      </EmptyState>
    )
  }

  const completedSets = session.exercises.reduce(
    (n, ex) => n + ex.sets.filter((s) => s.done).length,
    0,
  )
  const totalSets = session.exercises.reduce((n, ex) => n + ex.sets.length, 0)
  const progressPct = totalSets > 0 ? (completedSets / totalSets) * 100 : 0
  const barWeight = (profile?.unit ?? 'lb') === 'kg' ? prefs.barWeightKg : prefs.barWeightLb

  function handleSetChange(
    exIndex: number,
    setId: string,
    patch: { reps?: number | null; weight?: number | null; done?: boolean; rir?: number | null },
  ) {
    updateSet(session!.id, exIndex, setId, patch)
    // Checking a set off: light haptic tick, prime audio for the end-of-rest
    // beep (needs a user gesture), and start the rest countdown.
    if (patch.done === true && !session!.completedAt) {
      try {
        navigator.vibrate?.(15)
      } catch {
        /* not supported */
      }
      if (prefs.restSeconds > 0) {
        if (prefs.restSound) primeAudio()
        setRestEndsAt(Date.now() + prefs.restSeconds * 1000)
      }
    }
  }

  function handleFinish() {
    setRestEndsAt(null)
    finishSession(session!.id)
    navigate(`/summary/${session!.id}`)
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
    <div className="space-y-4">
      {/* Sticky live-session header with progress bar */}
      <div className="sticky top-[53px] z-10 -mx-4 border-b border-slate-700/60 bg-slate-900/95 px-4 pb-2.5 pt-1.5 backdrop-blur-md">
        <div className="flex items-center justify-between gap-2">
          <h1 className="truncate text-lg font-bold tracking-tight">{session.dayName}</h1>
          <div className="flex shrink-0 items-center gap-2">
            <input
              id="session-date"
              type="date"
              aria-label="Workout date"
              value={session.date}
              onChange={(e) => setSessionDate(session.id, e.target.value)}
              className="rounded-md border border-slate-700 bg-slate-800 px-1.5 py-1 text-xs text-slate-300"
            />
            <span
              className="rounded-full px-2 py-0.5 text-xs font-semibold"
              style={{ backgroundColor: (profile?.color ?? '#a3e635') + '22', color: profile?.color }}
            >
              {profile?.name}
            </span>
          </div>
        </div>
        <div className="mt-2 flex items-center gap-2.5">
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-slate-700/70">
            <div
              className="h-full rounded-full bg-sky-500 transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <span className="text-[11px] font-semibold tabular-nums text-slate-400">
            {completedSets}/{totalSets} sets
          </span>
        </div>
      </div>

      {/* Exercises */}
      {session.exercises.length === 0 && (
        <EmptyState title="No exercises">Add an exercise below to start logging.</EmptyState>
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
            history={recentPerformances(allSessions, session.profileId, ex.name, session.id)}
            unit={profile?.unit ?? 'lb'}
            barWeight={barWeight}
            isPR={prs.has(prKey(session.id, exIndex))}
            momentum={exerciseMomentum(allSessions, session.profileId, ex.name, session.id)?.level ?? null}
            onSetChange={(setId, patch) => handleSetChange(exIndex, setId, patch)}
            onWeightChange={(setId, weight) => updateSetWeight(session.id, exIndex, setId, weight)}
            onSwap={(name) => fillSessionSlot(session.id, exIndex, name)}
            onAddSet={(afterSetId) => addSet(session.id, exIndex, afterSetId)}
            onRemoveSet={(setId) => removeSet(session.id, exIndex, setId)}
            onNotes={(notes) => setExerciseNotes(session.id, exIndex, notes)}
          />
        ),
      )}

      {restEndsAt !== null && (
        <RestTimer
          endsAt={restEndsAt}
          sound={prefs.restSound}
          onExtend={(ms) => setRestEndsAt((v) => (v ?? Date.now()) + ms)}
          onDismiss={() => setRestEndsAt(null)}
        />
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
            Finish workout
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

/** Per-side plate loading for each distinct weight in this exercise's sets. */
function PlatePanel({ ex, unit, barWeight }: { ex: LoggedExercise; unit: WeightUnit; barWeight: number }) {
  const plates = platesForUnit(unit)
  const weights = [...new Set(ex.sets.map((s) => s.weight).filter((w): w is number => w != null))]

  return (
    <div className="mt-2 rounded-lg bg-slate-900/60 p-3 text-sm">
      <div className="mb-1.5 flex items-baseline justify-between">
        <span className="font-semibold text-slate-300">Plates per side</span>
        <span className="text-xs text-slate-500">
          {barWeight} {unit} bar — change in Settings
        </span>
      </div>
      {weights.length === 0 ? (
        <p className="text-slate-500">Enter a weight above to see the plate math.</p>
      ) : (
        <div className="space-y-1">
          {weights.map((w) => {
            const b = platesPerSide(w, barWeight, plates)
            return (
              <div key={w} className="flex items-baseline justify-between gap-3">
                <span className="font-mono font-semibold tabular-nums">{w}</span>
                <span className="text-right text-slate-300">
                  {b == null
                    ? 'below bar weight'
                    : b.counts.length === 0
                      ? 'empty bar'
                      : formatPlates(b)}
                  {b != null && b.remainder > 0 && (
                    <span className="text-amber-400"> (~{b.remainder} short)</span>
                  )}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------

/** Warm-up pyramid up to the first working weight (bar → 55% → 75% → 90%). */
function WarmupPanel({ ex, unit, barWeight }: { ex: LoggedExercise; unit: WeightUnit; barWeight: number }) {
  const working = ex.sets.find((s) => s.weight != null && s.weight > 0)?.weight ?? ex.suggestion?.weight ?? null
  const ramp = working != null ? warmupRamp(working, barWeight, unit) : []

  return (
    <div className="mt-2 rounded-lg bg-slate-900/60 p-3 text-sm">
      <div className="mb-1.5 flex items-baseline justify-between">
        <span className="font-semibold text-slate-300">Warm-up ramp</span>
        {working != null && (
          <span className="text-xs text-slate-500">
            working {working} {unit}
          </span>
        )}
      </div>
      {working == null || ramp.length === 0 ? (
        <p className="text-slate-500">Set a working weight above and the ramp appears here.</p>
      ) : (
        <div className="space-y-1">
          {ramp.map((w, i) => (
            <div key={i} className="flex items-baseline justify-between gap-3">
              <span className="font-mono font-semibold tabular-nums">
                {w.weight} {unit}
              </span>
              <span className="text-slate-300">× {w.reps}</span>
            </div>
          ))}
          <p className="pt-1 text-xs text-slate-500">Warm-up sets don't count toward volume — don't log them.</p>
        </div>
      )}
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
    <div
      className="card border-dashed p-4"
      style={{ borderColor: muscleRegionColor(muscleId) + '66' }}
    >
      <div className="flex items-baseline justify-between gap-2">
        <MuscleTag muscleId={muscleId} />
        <span className="text-xs text-slate-400">
          {sets} set{sets === 1 ? '' : 's'}
          {targetReps ? ` × ${targetReps}` : ''}
        </span>
      </div>
      <p className="mt-2 text-xs text-slate-400">
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

function parseNum(v: string): number | null {
  if (v.trim() === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

function ExerciseCard({
  ex,
  last,
  history,
  unit,
  barWeight,
  isPR,
  momentum,
  onSetChange,
  onWeightChange,
  onSwap,
  onAddSet,
  onRemoveSet,
  onNotes,
}: {
  ex: LoggedExercise
  last: { date: string; exercise: LoggedExercise } | null
  /** Recent performances of this exercise, for the per-set target model. */
  history: LoggedExercise[]
  unit: string
  barWeight: number
  isPR: boolean
  momentum: import('../lib/momentum').MomentumLevel | null
  onSetChange: (
    setId: string,
    patch: { reps?: number | null; weight?: number | null; done?: boolean; rir?: number | null },
  ) => void
  /** Weight edits go through the cascading store action. */
  onWeightChange: (setId: string, weight: number | null) => void
  /** Replace this exercise with a same-muscle alternative (machine taken). */
  onSwap: (name: string) => void
  onAddSet: (afterSetId?: string) => void
  onRemoveSet: (setId: string) => void
  onNotes: (notes: string) => void
}) {
  const [showNotes, setShowNotes] = useState(!!ex.notes)
  const [showRIR, setShowRIR] = useState(() => ex.sets.some((s) => s.rir != null))
  const [showPlates, setShowPlates] = useState(false)
  const [showSwap, setShowSwap] = useState(false)
  const [showWarmup, setShowWarmup] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [openSetMenu, setOpenSetMenu] = useState<string | null>(null)

  // Finished exercises fold into a slim row so long days stay scannable.
  const allDone = ex.sets.length > 0 && ex.sets.every((s) => s.done)
  const [collapsed, setCollapsed] = useState(allDone)
  const wasAllDone = useRef(allDone)
  useEffect(() => {
    if (allDone && !wasAllDone.current) setCollapsed(true)
    if (!allDone) setCollapsed(false)
    wasAllDone.current = allDone
  }, [allDone])

  // The exercise's main mover: colored tag + source for same-muscle swaps.
  const primaryMuscle = Object.entries(ex.muscles ?? {}).sort((a, b) => b[1] - a[1])[0]?.[0]

  const grid = showRIR
    ? 'grid grid-cols-[1.75rem_1fr_1fr_3rem_2.75rem_1.25rem] items-center gap-1.5'
    : 'grid grid-cols-[1.75rem_1fr_1fr_2.75rem_1.25rem] items-center gap-1.5'

  // Ghost placeholders: what you did on the same set number last time.
  const lastReps = (last?.exercise.sets ?? []).map((s) =>
    s.reps != null ? String(s.reps) : undefined,
  )

  // The per-set target model: your recent strength (RIR-aware e1RM) plus your
  // personal set-to-set fatigue curve. Goals recompute live with the weight.
  const model = useMemo(() => buildSetModel(history), [history])

  function goalFor(setIndex: number, weight: number | null): number | null {
    if (!model || weight == null || weight <= 0) return null
    const ls = last?.exercise.sets[setIndex]
    const lastSame = ls && ls.weight === weight ? ls.reps : null
    return setTarget(model, weight, setIndex, lastSame)
  }

  const suggestion = ex.suggestion

  if (collapsed) {
    return (
      <button
        className="card flex w-full items-center justify-between gap-2 p-3.5 text-left"
        onClick={() => setCollapsed(false)}
        title="Expand exercise"
      >
        <div className="flex min-w-0 items-center gap-2">
          {primaryMuscle && <MuscleTag muscleId={primaryMuscle} />}
          <span className="truncate font-bold">{ex.name}</span>
          {isPR && <PRBadge />}
        </div>
        <span className="flex shrink-0 items-center gap-1.5 text-sm font-bold text-sky-500">
          {ex.sets.length} ✓ <span className="font-normal text-slate-500">▾</span>
        </span>
      </button>
    )
  }

  return (
    <div className="card p-4">
      {/* Tag row: muscle group + status, kebab on the right */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {primaryMuscle && <MuscleTag muscleId={primaryMuscle} />}
          {isPR && <PRBadge />}
          {momentum && <MomentumBadge level={momentum} compact />}
        </div>
        <button
          aria-label="Exercise options"
          className={`shrink-0 rounded-md px-2 py-0.5 text-lg leading-none ${showMenu ? 'bg-slate-700/60 text-slate-200' : 'text-slate-500 hover:text-slate-300'}`}
          onClick={() => setShowMenu((v) => !v)}
        >
          ⋮
        </button>
      </div>

      <h3 className="mt-1.5 text-lg font-bold leading-tight">{ex.name}</h3>
      {ex.pinnedNote && <div className="mt-0.5 text-xs italic text-slate-300">{ex.pinnedNote}</div>}

      {/* Exercise menu (RP-style kebab) */}
      {showMenu && (
        <div className="mt-2 grid grid-cols-5 gap-1.5">
          {(
            [
              ['Warmup', showWarmup, () => setShowWarmup((v) => !v)],
              ['Plates', showPlates, () => setShowPlates((v) => !v)],
              ['RIR', showRIR, () => setShowRIR((v) => !v)],
              ['Note', showNotes, () => setShowNotes((v) => !v)],
              ['Swap', showSwap, () => primaryMuscle && setShowSwap((v) => !v)],
            ] as [string, boolean, () => void][]
          ).map(([label, active, toggle]) => (
            <button
              key={label}
              className={`rounded-lg border py-1.5 text-[11px] font-semibold transition ${
                active
                  ? 'border-sky-500/60 bg-sky-500/10 text-sky-400'
                  : 'border-slate-700 text-slate-300 hover:bg-slate-700/40'
              }`}
              onClick={toggle}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* The coach's prescription for this session */}
      {suggestion && (
        <div className="mt-2.5 rounded-md border-l-2 border-sky-500 bg-sky-500/10 px-2.5 py-1.5">
          {suggestion.action !== 'baseline' ? (
            <>
              <span className="text-xs font-bold text-sky-300">
                Target {suggestion.weight != null ? `${suggestion.weight} ${unit} × ` : ''}
                {suggestion.reps} reps
              </span>
              <span className="ml-1.5 text-[11px] text-slate-400">{suggestion.note}</span>
            </>
          ) : (
            <span className="text-[11px] text-slate-400">{suggestion.note}</span>
          )}
        </div>
      )}

      {last && (
        <div className="mt-1.5 text-[11px] text-slate-500">
          Last: <span className="text-slate-400">{summarizeSets(last.exercise)}</span>
        </div>
      )}

      {showSwap && primaryMuscle && (
        <div className="mt-2">
          <p className="mb-1.5 text-xs text-slate-500">
            Machine taken? Pick a replacement — your targets recompute for it.
          </p>
          <ExerciseSlotPicker
            muscleId={primaryMuscle}
            value=""
            onPick={(name) => {
              setShowSwap(false)
              onSwap(name)
            }}
          />
        </div>
      )}

      {showPlates && <PlatePanel ex={ex} unit={unit as WeightUnit} barWeight={barWeight} />}
      {showWarmup && <WarmupPanel ex={ex} unit={unit as WeightUnit} barWeight={barWeight} />}

      {/* Set table */}
      <div className={`mt-3 ${grid} text-[10px] font-medium uppercase tracking-[0.12em] text-slate-500`}>
        <span className="text-center">Set</span>
        <span className="text-center">{unit}</span>
        <span className="text-center">Reps</span>
        {showRIR && <span className="text-center">RIR</span>}
        <span className="text-center">Log</span>
        <span />
      </div>

      <div className="mt-1.5 space-y-1.5">
        {ex.sets.map((s, i) => {
          const goal = goalFor(i, s.weight)
          const hitGoal = s.done && goal != null && s.reps != null && s.reps >= goal
          return (
            <div key={s.id}>
              <div className={grid}>
                <span
                  className={`text-center text-sm font-bold tabular-nums ${hitGoal ? 'text-sky-500' : 'text-slate-500'}`}
                  title={goal != null ? `Goal: ${goal} reps` : undefined}
                >
                  {i + 1}
                </span>
                <input
                  type="number"
                  inputMode="decimal"
                  aria-label="Weight"
                  className="set-cell"
                  placeholder="—"
                  value={s.weight ?? ''}
                  onChange={(e) => onWeightChange(s.id, parseNum(e.target.value))}
                />
                <input
                  type="number"
                  inputMode="numeric"
                  aria-label="Reps"
                  className="set-cell"
                  placeholder={goal != null ? String(goal) : (lastReps[i] ?? '—')}
                  value={s.reps ?? ''}
                  onChange={(e) => onSetChange(s.id, { reps: parseNum(e.target.value) })}
                />
                {showRIR && (
                  <select
                    aria-label="Reps in reserve"
                    value={s.rir ?? ''}
                    onChange={(e) =>
                      onSetChange(s.id, { rir: e.target.value === '' ? null : Number(e.target.value) })
                    }
                    className="set-cell px-0 text-sm"
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
                  className={`mx-auto flex h-11 w-11 items-center justify-center rounded-lg border-2 text-xl font-bold transition active:scale-95 ${
                    s.done
                      ? 'border-sky-500 bg-sky-500 text-slate-950'
                      : 'border-sky-500/40 text-transparent hover:border-sky-500/70'
                  }`}
                >
                  ✓
                </button>
                <button
                  aria-label="Set options"
                  onClick={() => setOpenSetMenu((v) => (v === s.id ? null : s.id))}
                  className={`text-center text-lg leading-none ${openSetMenu === s.id ? 'text-slate-200' : 'text-slate-600 hover:text-slate-400'}`}
                >
                  ⋮
                </button>
              </div>
              {openSetMenu === s.id && (
                <div className="mt-1.5 flex gap-1.5 rounded-lg bg-slate-900/70 p-1.5">
                  <button
                    className="flex-1 rounded-md border border-slate-700 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700/40"
                    onClick={() => {
                      onAddSet(s.id)
                      setOpenSetMenu(null)
                    }}
                  >
                    + Add set below
                  </button>
                  <button
                    className="flex-1 rounded-md border border-rose-500/40 py-1.5 text-xs font-semibold text-rose-400 hover:bg-rose-500/10"
                    onClick={() => {
                      onRemoveSet(s.id)
                      setOpenSetMenu(null)
                    }}
                  >
                    Delete set
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <button
        className="mt-2 w-full rounded-lg border border-dashed border-slate-600 py-2 text-xs font-semibold text-slate-400 transition hover:border-slate-500 hover:text-slate-300"
        onClick={() => onAddSet()}
      >
        + Add set
      </button>

      {model && (
        <p className="mt-1.5 text-[10px] text-slate-600">
          Faint numbers are your rep goals. Hit one and the set number lights up.
        </p>
      )}

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
