import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useStore, useActiveProfile, useProfileSessions } from '../store/useStore'
import { loggedExerciseNames, summarizeSets } from '../lib/history'
import { bestEstimated1RM, topSetWeight, totalVolume, sessionVolume, round1 } from '../lib/stats'
import { formatShort, formatDate } from '../lib/date'
import { computePRSet, prKey } from '../lib/pr'
import { projectTrend, type DatedPoint } from '../lib/progression'
import { PageHeader, EmptyState, Stat } from '../components/ui'
import { LineChartCard, type ChartPoint } from '../components/LineChartCard'
import { MusclesTab } from './MusclesTab'

type Metric = '1rm' | 'top' | 'volume'
const METRICS: { key: Metric; label: string }[] = [
  { key: '1rm', label: 'Est. 1RM' },
  { key: 'top', label: 'Top set' },
  { key: 'volume', label: 'Volume' },
]

type Tab = 'charts' | 'muscles' | 'history'
const TABS: { key: Tab; label: string }[] = [
  { key: 'charts', label: 'Charts' },
  { key: 'muscles', label: 'Muscles' },
  { key: 'history', label: 'History' },
]

export function ProgressPage() {
  const [params] = useSearchParams()
  const initialTab = (TABS.find((t) => t.key === params.get('tab'))?.key ?? 'charts') as Tab
  const [tab, setTab] = useState<Tab>(initialTab)

  return (
    <div className="space-y-5">
      <PageHeader title="Progress" subtitle="Review how you're trending over time." />

      <div className="grid grid-cols-3 gap-1 rounded-xl bg-slate-800 p-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-lg py-2 text-sm font-semibold transition ${
              tab === t.key ? 'bg-sky-500 text-slate-950' : 'text-slate-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'charts' && <ChartsTab />}
      {tab === 'muscles' && <MusclesTab />}
      {tab === 'history' && <HistoryTab />}
    </div>
  )
}

// ---------------------------------------------------------------------------

function ChartsTab() {
  const profile = useActiveProfile()
  const sessions = useProfileSessions()
  const names = useMemo(
    () => (profile ? loggedExerciseNames(sessions, profile.id) : []),
    [sessions, profile],
  )

  const [selected, setSelected] = useState('')
  const [metric, setMetric] = useState<Metric>('1rm')

  const exercise = selected || names[0] || ''

  const { points, best, projection, trendNote } = useMemo(() => {
    const rows = sessions
      .filter((s) => s.exercises.some((e) => e.name.toLowerCase() === exercise.toLowerCase()))
      .slice()
      .sort((a, b) => a.date.localeCompare(b.date))

    const pts: ChartPoint[] = []
    const dated: DatedPoint[] = []
    let bestVal = 0
    for (const s of rows) {
      const ex = s.exercises.find((e) => e.name.toLowerCase() === exercise.toLowerCase())!
      let value = 0
      if (metric === '1rm') value = bestEstimated1RM(ex)
      else if (metric === 'top') value = topSetWeight(ex)
      else value = totalVolume(ex)
      value = round1(value)
      if (value > 0) {
        pts.push({ label: formatShort(s.date), value })
        dated.push({ date: s.date, value })
        bestVal = Math.max(bestVal, value)
      }
    }

    // Forecast: fit a line through the history and project 4 weeks forward.
    const trend = projectTrend(dated, 4)
    let proj: ChartPoint[] | undefined
    let note: string | undefined
    if (trend) {
      proj = trend.points.map((p) => ({ label: formatShort(p.date), value: p.value }))
      const eta = trend.points[trend.points.length - 1].value
      if (trend.slopePerWeek > 0.05) {
        note = `Trending +${trend.slopePerWeek}/week — on pace for ~${eta} in 4 weeks (dashed line).`
      } else if (trend.slopePerWeek < -0.05) {
        note = `Trending ${trend.slopePerWeek}/week — consider a deload or a form/recovery check.`
      } else {
        note = 'Holding steady — to keep progressing, follow the in-workout targets or add a set.'
      }
    }
    return { points: pts, best: bestVal, projection: proj, trendNote: note }
  }, [sessions, exercise, metric])

  if (names.length === 0) {
    return (
      <EmptyState icon="📈" title="No data yet">
        Finish a workout or two and your strength charts will appear here.
      </EmptyState>
    )
  }

  const unit = metric === 'volume' ? `${profile?.unit}·reps` : profile?.unit

  return (
    <div className="space-y-4">
      <div className="card space-y-3 p-4">
        <div>
          <label className="label" htmlFor="ex-select">
            Exercise
          </label>
          <select
            id="ex-select"
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

        <div className="grid grid-cols-3 gap-1 rounded-xl bg-slate-900/70 p-1">
          {METRICS.map((m) => (
            <button
              key={m.key}
              onClick={() => setMetric(m.key)}
              className={`rounded-lg py-1.5 text-xs font-semibold transition ${
                metric === m.key ? 'bg-slate-700 text-white' : 'text-slate-400'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Stat label={`Best ${METRICS.find((m) => m.key === metric)!.label}`} value={`${best} ${unit ?? ''}`} accent={profile?.color} />
        <Stat label="Sessions" value={points.length} />
      </div>

      <LineChartCard
        title={exercise}
        unit={unit}
        color={profile?.color}
        data={points}
        projection={projection}
        trendNote={trendNote}
      />
      <p className="px-1 text-xs text-slate-500">
        Estimated 1RM uses the Epley formula (weight × (1 + reps ÷ 30)). It's an estimate to track
        trends, not a max you should attempt.
      </p>
    </div>
  )
}

// ---------------------------------------------------------------------------

function HistoryTab() {
  const navigate = useNavigate()
  const sessions = useProfileSessions()
  const profile = useActiveProfile()
  const deleteSession = useStore((s) => s.deleteSession)
  const [openId, setOpenId] = useState<string | null>(null)

  const prs = useMemo(
    () => (profile ? computePRSet(sessions, profile.id) : new Set<string>()),
    [sessions, profile],
  )

  if (sessions.length === 0) {
    return (
      <EmptyState icon="🗓️" title="No workouts logged yet">
        Start a workout from the <strong>Today</strong> tab and it'll show up here.
      </EmptyState>
    )
  }

  return (
    <div className="space-y-3">
      {sessions.map((s) => {
        const open = openId === s.id
        const vol = round1(sessionVolume(s))
        const sessionHasPR = s.exercises.some((_, i) => prs.has(prKey(s.id, i)))
        return (
          <div key={s.id} className="card overflow-hidden">
            <button
              className="flex w-full items-center justify-between gap-2 p-4 text-left"
              onClick={() => setOpenId(open ? null : s.id)}
            >
              <div>
                <div className="flex items-center gap-1.5 font-semibold">
                  {s.dayName}
                  {sessionHasPR && <span title="New personal record">🏆</span>}
                </div>
                <div className="text-xs text-slate-400">
                  {formatDate(s.date)}
                  {!s.completedAt && <span className="ml-2 text-amber-400">· in progress</span>}
                </div>
              </div>
              <div className="text-right text-xs text-slate-400">
                <div>{s.exercises.length} exercises</div>
                <div>{vol > 0 ? `${vol} ${profile?.unit}·reps` : ''}</div>
              </div>
            </button>

            {open && (
              <div className="space-y-2 border-t border-slate-700/60 p-4">
                {s.exercises.map((ex, i) => (
                  <div key={ex.exerciseId + i} className="text-sm">
                    <div className="flex items-center gap-1.5 font-medium">
                      {ex.name}
                      {prs.has(prKey(s.id, i)) && <span title="New personal record">🏆</span>}
                    </div>
                    <div className="text-slate-400">{summarizeSets(ex)}</div>
                  </div>
                ))}
                {s.notes && (
                  <div className="rounded-lg bg-slate-900/60 p-2 text-sm text-slate-300">
                    📝 {s.notes}
                  </div>
                )}
                <div className="flex gap-2 pt-1">
                  <button className="btn-ghost flex-1 py-2 text-sm" onClick={() => navigate(`/workout/${s.id}`)}>
                    Open / edit
                  </button>
                  <button
                    className="btn-ghost py-2 text-sm hover:text-rose-400"
                    onClick={() => confirm('Delete this workout?') && deleteSession(s.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
