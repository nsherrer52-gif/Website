import { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { funEquivalence, lifetimeTonnage, round1, sessionVolume } from '../lib/stats'
import { computePRSet, prKey } from '../lib/pr'
import { muscleVolumeForSessions, roundVol, doneSetCount } from '../lib/volume'
import { muscleName } from '../lib/muscles'
import { formatLongDate } from '../lib/date'
import { summarizeSets } from '../lib/history'
import { EmptyState, Stat, PRBadge } from '../components/ui'
import { Buddy } from '../components/Buddy'

/** The post-workout victory lap: totals, PRs, muscles hit, and vs-last-time. */
export function SummaryPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const sessions = useStore((s) => s.sessions)
  const profiles = useStore((s) => s.profiles)
  const library = useStore((s) => s.exerciseLibrary)

  const session = sessions.find((x) => x.id === id)
  const profile = profiles.find((p) => p.id === session?.profileId)

  const prs = useMemo(
    () => (session ? computePRSet(sessions, session.profileId) : new Set<string>()),
    [sessions, session],
  )

  const muscles = useMemo(() => {
    if (!session) return []
    return Object.entries(muscleVolumeForSessions([session], library))
      .filter(([, v]) => v > 0)
      .sort((a, b) => b[1] - a[1])
  }, [session, library])

  const vsLast = useMemo(() => {
    if (!session?.completedAt) return null
    const prev = sessions
      .filter(
        (x) =>
          x.profileId === session.profileId &&
          x.dayId === session.dayId &&
          x.id !== session.id &&
          x.completedAt != null &&
          x.completedAt < session.completedAt!,
      )
      .sort((a, b) => b.completedAt! - a.completedAt!)[0]
    if (!prev) return null
    const prevVol = sessionVolume(prev)
    const thisVol = sessionVolume(session)
    if (prevVol <= 0 || thisVol <= 0) return null
    return Math.round(((thisVol - prevVol) / prevVol) * 100)
  }, [session, sessions])

  if (!session) {
    return (
      <EmptyState icon="🤔" title="Workout not found">
        <button className="text-sky-400 underline" onClick={() => navigate('/')}>
          Go home
        </button>
      </EmptyState>
    )
  }

  const volume = round1(sessionVolume(session))
  const setsDone = session.exercises.reduce((n, e) => n + doneSetCount(e), 0)
  const prExercises = session.exercises.filter((_, i) => prs.has(prKey(session.id, i)))
  const durationMin = session.completedAt
    ? Math.max(1, Math.round((session.completedAt - session.startedAt) / 60000))
    : null

  return (
    <div className="space-y-5">
      <div className="card border-sky-500/40 p-5 text-center">
        <Buddy pose="cheer" className="mx-auto h-16 w-16" />
        <h1 className="mt-1 text-2xl font-bold tracking-tight">Workout complete!</h1>
        <p className="mt-1 text-sm text-slate-400">
          {session.dayName} · {formatLongDate(session.date)}
          {durationMin != null && ` · ${durationMin} min`}
        </p>
        <Tonnage sessionsAll={sessions} profileId={session.profileId} unit={profile?.unit ?? 'lb'} />
        {vsLast != null && (
          <p
            className={`mt-2 text-sm font-semibold ${
              vsLast >= 0 ? 'text-emerald-400' : 'text-amber-400'
            }`}
          >
            {vsLast >= 0 ? '▲' : '▼'} {Math.abs(vsLast)}% volume vs your last {session.dayName}
          </p>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Stat label="Sets done" value={setsDone} accent={profile?.color} />
        <Stat label="Volume" value={volume > 0 ? `${volume}` : '—'} />
        <Stat label="PRs" value={prExercises.length > 0 ? prExercises.length : '—'} />
      </div>

      {prExercises.length > 0 && (
        <div className="card space-y-2 p-4">
          <h2 className="flex items-center gap-2 font-semibold">New personal records <PRBadge /></h2>
          {prExercises.map((e, i) => (
            <div key={e.exerciseId + i} className="text-sm">
              <span className="font-medium">{e.name}</span>
              <span className="text-slate-400"> — {summarizeSets(e)}</span>
            </div>
          ))}
        </div>
      )}

      {muscles.length > 0 && (
        <div className="card p-4">
          <h2 className="mb-2 font-semibold">Muscles trained</h2>
          <div className="flex flex-wrap gap-2">
            {muscles.map(([m, sets]) => (
              <span
                key={m}
                className="rounded-full border border-slate-600/60 bg-slate-700/40 px-3 py-1 text-sm"
              >
                {muscleName(m)} <span className="text-slate-400">{roundVol(sets)}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <button className="btn-primary w-full py-3" onClick={() => navigate('/progress')}>
          View progress
        </button>
        <button className="btn-ghost w-full" onClick={() => navigate('/')}>
          Done
        </button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------

/** "Lifetime lifted: 1,240,000 lb · ≈ 92 elephants" */
function Tonnage({
  sessionsAll,
  profileId,
  unit,
}: {
  sessionsAll: Parameters<typeof lifetimeTonnage>[0]
  profileId: string
  unit: 'lb' | 'kg'
}) {
  const total = Math.round(lifetimeTonnage(sessionsAll, profileId))
  if (total <= 0) return null
  const equiv = funEquivalence(total, unit)
  return (
    <p className="mt-2 text-xs text-slate-500">
      Lifetime lifted:{' '}
      <span className="font-semibold text-slate-300">
        {total.toLocaleString()} {unit}
      </span>
      {equiv && <span> · {equiv}</span>}
    </p>
  )
}
