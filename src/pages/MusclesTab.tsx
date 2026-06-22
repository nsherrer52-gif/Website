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
