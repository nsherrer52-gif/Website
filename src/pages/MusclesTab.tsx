import { useMemo, useState } from 'react'
import type { MuscleId } from '../types'
import { useStore, useActiveProfile } from '../store/useStore'
import {
  DEFAULT_MUSCLE_TARGETS,
  musclesByRegion,
  muscleName,
  statusColor,
} from '../lib/muscles'
import {
  currentWeekVolume,
  currentWeekKey,
  doneSetCount,
  isoWeekKey,
  roundVol,
  weeklyMuscleVolume,
} from '../lib/volume'
import { formatShort } from '../lib/date'
import { weeklyRecommendations, type MuscleRecommendation } from '../lib/coach'
import { Stat } from '../components/ui'
import { BodyMap } from '../components/BodyMap'
import { MuscleVolumeBar } from '../components/MuscleVolumeBar'
import { LineChartCard, type ChartPoint } from '../components/LineChartCard'

export function MusclesTab() {
  const profile = useActiveProfile()
  const sessions = useStore((s) => s.sessions)
  const library = useStore((s) => s.exerciseLibrary)
  const targets = useStore((s) => s.muscleTargets)
  const [selected, setSelected] = useState<MuscleId | null>(null)

  const pid = profile?.id ?? ''

  const week = useMemo(
    () => currentWeekVolume(sessions, pid, library),
    [sessions, pid, library],
  )
  const weekly = useMemo(
    () => weeklyMuscleVolume(sessions, pid, library),
    [sessions, pid, library],
  )

  const totalSets = useMemo(() => {
    const key = currentWeekKey()
    return sessions
      .filter((s) => s.profileId === pid && isoWeekKey(s.date) === key)
      .reduce((n, s) => n + s.exercises.reduce((m, e) => m + doneSetCount(e), 0), 0)
  }, [sessions, pid])

  const trained = Object.values(week).filter((v) => v > 0).length

  const recommendations = useMemo(
    () => weeklyRecommendations(sessions, pid, library, targets),
    [sessions, pid, library, targets],
  )

  const trend: ChartPoint[] = useMemo(() => {
    if (!selected) return []
    return weekly.map((w) => ({ label: formatShort(w.start), value: roundVol(w.totals[selected] ?? 0) }))
  }, [weekly, selected])

  function toggle(id: MuscleId) {
    setSelected((prev) => (prev === id ? null : id))
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Stat label="This week" value={`${roundVol(totalSets)} sets`} accent={profile?.color} />
        <Stat label="Muscles trained" value={`${trained} / 15`} />
      </div>

      <CoachCard recommendations={recommendations} />

      <div className="card space-y-3 p-4">
        <BodyMap volume={week} targets={targets} selected={selected} onSelect={toggle} />
        <Legend />
        <p className="text-center text-xs text-slate-500">
          {selected
            ? `${muscleName(selected)}: ${roundVol(week[selected] ?? 0)} sets this week — tap again to deselect`
            : 'Tap a muscle to see its weekly trend'}
        </p>
      </div>

      {musclesByRegion().map(({ region, muscles }) => (
        <div key={region} className="card space-y-3 p-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">{region}</h3>
          {muscles.map((m) => (
            <button
              key={m.id}
              onClick={() => toggle(m.id)}
              className={`block w-full rounded-lg p-1 text-left transition ${
                selected === m.id ? 'bg-slate-700/40' : 'hover:bg-slate-700/20'
              }`}
            >
              <MuscleVolumeBar
                name={m.name}
                sets={week[m.id] ?? 0}
                target={targets[m.id] ?? DEFAULT_MUSCLE_TARGETS[m.id]}
              />
            </button>
          ))}
        </div>
      ))}

      {selected && (
        <LineChartCard
          title={`${muscleName(selected)} — weekly sets`}
          unit="sets / week"
          color={profile?.color}
          data={trend}
        />
      )}
    </div>
  )
}

/** RP-style weekly prescriptions based on last week's completed volume. */
function CoachCard({ recommendations }: { recommendations: MuscleRecommendation[] }) {
  // Muscles you actually trained last week (plus any deload calls) are the
  // actionable ones; untrained muscles are summarized in one line.
  const active = recommendations.filter((r) => r.lastWeekSets > 0 || r.action === 'deload')
  const untrained = recommendations.filter((r) => r.lastWeekSets <= 0 && r.action !== 'deload')

  if (active.length === 0) {
    return (
      <div className="card p-4">
        <h3 className="font-semibold">Coach</h3>
        <p className="mt-1 text-sm text-slate-400">
          Log a full week of training and the coach will start prescribing weekly sets per muscle
          to keep you progressing.
        </p>
      </div>
    )
  }

  const order: Record<MuscleRecommendation['action'], number> = { deload: 0, increase: 1, hold: 2, start: 3 }
  const sorted = [...active].sort((a, b) => order[a.action] - order[b.action])

  const styles: Record<MuscleRecommendation['action'], { chip: string; label: string }> = {
    deload: { chip: 'bg-rose-500/15 text-rose-300 border-rose-500/40', label: 'Deload' },
    increase: { chip: 'bg-sky-500/15 text-sky-300 border-sky-500/40', label: 'Add' },
    hold: { chip: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40', label: 'Hold' },
    start: { chip: 'bg-slate-600/30 text-slate-300 border-slate-600/60', label: 'Start' },
  }

  return (
    <div className="card space-y-2.5 p-4">
      <div className="flex items-baseline justify-between">
        <h3 className="font-semibold">Coach · this week</h3>
        <span className="text-xs text-slate-500">based on last week</span>
      </div>
      {sorted.map((r) => (
        <div key={r.muscleId} className="flex items-start gap-2 text-sm">
          <span
            className={`mt-0.5 shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${styles[r.action].chip}`}
          >
            {styles[r.action].label}
          </span>
          <div className="min-w-0">
            <span className="font-medium">{muscleName(r.muscleId)}</span>
            <span className="text-slate-400">
              {' '}
              · {roundVol(r.lastWeekSets)} last wk → aim {r.suggestedSets}
            </span>
            <div className="text-xs text-slate-500">{r.reason}</div>
          </div>
        </div>
      ))}
      {untrained.length > 0 && (
        <p className="border-t border-slate-700/60 pt-2 text-xs text-slate-500">
          Not trained last week: {untrained.map((r) => muscleName(r.muscleId)).join(', ')} — start
          back at your minimums.
        </p>
      )}
    </div>
  )
}

function Legend() {
  const items: { label: string; status: Parameters<typeof statusColor>[0] }[] = [
    { label: 'None', status: 'none' },
    { label: 'Under', status: 'under' },
    { label: 'In range', status: 'in' },
    { label: 'Over', status: 'over' },
  ]
  return (
    <div className="flex flex-wrap justify-center gap-3 text-xs text-slate-400">
      {items.map((it) => (
        <span key={it.label} className="flex items-center gap-1.5">
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: statusColor(it.status) }}
          />
          {it.label}
        </span>
      ))}
    </div>
  )
}
