import { useMemo, useState } from 'react'
import { useStore } from '../store/useStore'
import { loggedExerciseNames } from '../lib/history'
import { bestEstimated1RM, round1 } from '../lib/stats'
import { computePRSet, prKey } from '../lib/pr'
import { currentWeekKey, doneSetCount, isoWeekKey, roundVol } from '../lib/volume'
import { EmptyState } from '../components/ui'
import { CompareChart, type CompareSeries } from '../components/CompareChart'
import type { Profile, Session } from '../types'

/** Brother vs. brother: the same lift, both trends, and this week's numbers. */
export function VersusTab() {
  const profiles = useStore((s) => s.profiles)
  const sessions = useStore((s) => s.sessions)

  // Exercises anyone has logged (union), for the picker.
  const names = useMemo(() => {
    const all = new Set<string>()
    for (const p of profiles) for (const n of loggedExerciseNames(sessions, p.id)) all.add(n)
    return [...all].sort((a, b) => a.localeCompare(b))
  }, [profiles, sessions])

  const [selected, setSelected] = useState('')
  const exercise = selected || names[0] || ''

  const series: CompareSeries[] = useMemo(
    () =>
      profiles.map((p) => ({
        name: p.name,
        color: p.color,
        points: e1rmPoints(sessions, p.id, exercise),
      })),
    [profiles, sessions, exercise],
  )

  const stats = useMemo(() => profiles.map((p) => profileStats(sessions, p, exercise)), [profiles, sessions, exercise])

  if (profiles.length < 2) {
    return (
      <EmptyState icon="⚔️" title="Rivalry needs a rival">
        Add your brother as a second person in <strong>Settings</strong> and this tab turns into a
        head-to-head: both your strength curves on one chart, weekly sets, and PR counts.
      </EmptyState>
    )
  }

  if (names.length === 0) {
    return (
      <EmptyState icon="⚔️" title="No lifts logged yet">
        Once you've both trained, pick any shared exercise here and watch the race.
      </EmptyState>
    )
  }

  return (
    <div className="space-y-4">
      <div className="card p-4">
        <label className="label" htmlFor="vs-exercise">
          Exercise
        </label>
        <select
          id="vs-exercise"
          className="input"
          value={exercise}
          onChange={(e) => setSelected(e.target.value)}
        >
          {names.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </div>

      <CompareChart series={series} unit="est. 1RM" />

      {/* Head-to-head numbers; the leading value lights up in its owner's color */}
      <div className="card overflow-hidden">
        <div
          className="grid items-center gap-2 border-b border-slate-700/60 px-4 py-3"
          style={{ gridTemplateColumns: `1.2fr repeat(${profiles.length}, 1fr)` }}
        >
          <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-slate-500">
            This week
          </span>
          {profiles.map((p) => (
            <span
              key={p.id}
              className="truncate text-right font-[family-name:var(--font-display)] font-bold"
              style={{ color: p.color }}
            >
              {p.name}
            </span>
          ))}
        </div>
        {(
          [
            ['Best est. 1RM', stats.map((s) => s.best1RM)],
            ['Workouts', stats.map((s) => s.workoutsThisWeek)],
            ['Sets', stats.map((s) => s.setsThisWeek)],
            ['PRs (30 days)', stats.map((s) => s.prs30)],
          ] as [string, number[]][]
        ).map(([label, values]) => {
          const max = Math.max(...values)
          return (
            <div
              key={label}
              className="grid items-center gap-2 border-b border-slate-700/40 px-4 py-2.5 last:border-b-0"
              style={{ gridTemplateColumns: `1.2fr repeat(${profiles.length}, 1fr)` }}
            >
              <span className="text-sm text-slate-400">{label}</span>
              {values.map((v, i) => {
                const leads = v > 0 && v === max
                return (
                  <span
                    key={profiles[i].id}
                    className="text-right font-[family-name:var(--font-display)] text-lg font-bold tabular-nums"
                    style={leads ? { color: profiles[i].color } : { color: '#8c95a3' }}
                  >
                    {v > 0 ? v : '—'}
                  </span>
                )
              })}
            </div>
          )
        })}
      </div>
      <p className="px-1 text-xs text-slate-500">
        Compares the people on this device. May the best brother win.
      </p>
    </div>
  )
}

// ---------------------------------------------------------------------------

function e1rmPoints(sessions: Session[], profileId: string, exercise: string) {
  return sessions
    .filter(
      (s) =>
        s.profileId === profileId &&
        s.exercises.some((e) => e.name.toLowerCase() === exercise.toLowerCase()),
    )
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((s) => {
      const ex = s.exercises.find((e) => e.name.toLowerCase() === exercise.toLowerCase())!
      return { date: s.date, value: round1(bestEstimated1RM(ex)) }
    })
    .filter((p) => p.value > 0)
}

function profileStats(sessions: Session[], profile: Profile, exercise: string) {
  const mine = sessions.filter((s) => s.profileId === profile.id)
  const week = currentWeekKey()
  const thisWeek = mine.filter((s) => isoWeekKey(s.date) === week)

  let best1RM = 0
  for (const s of mine) {
    for (const e of s.exercises) {
      if (e.name.toLowerCase() === exercise.toLowerCase()) {
        best1RM = Math.max(best1RM, bestEstimated1RM(e))
      }
    }
  }

  const prSet = computePRSet(sessions, profile.id)
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 30)
  const cutoffISO = cutoff.toISOString().slice(0, 10)
  let prs30 = 0
  for (const s of mine) {
    if (s.date < cutoffISO) continue
    s.exercises.forEach((_, i) => {
      if (prSet.has(prKey(s.id, i))) prs30++
    })
  }

  return {
    best1RM: round1(best1RM),
    workoutsThisWeek: thisWeek.filter((s) => s.completedAt != null).length,
    setsThisWeek: roundVol(
      thisWeek.reduce((n, s) => n + s.exercises.reduce((m, e) => m + doneSetCount(e), 0), 0),
    ),
    prs30,
  }
}
