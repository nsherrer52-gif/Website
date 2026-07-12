import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore, useActiveProfile } from '../store/useStore'
import { suggestedDayId } from '../lib/rotation'
import { formatDate } from '../lib/date'
import { currentWeekKey, currentWeekVolume, doneSetCount, isoWeekKey, roundVol } from '../lib/volume'
import { DEFAULT_MUSCLE_TARGETS, muscleName } from '../lib/muscles'
import { weeklyRecommendations } from '../lib/coach'
import { PageHeader, EmptyState, Stat } from '../components/ui'
import { Buddy } from '../components/Buddy'
import { MuscleVolumeBar } from '../components/MuscleVolumeBar'

export function TodayPage() {
  const navigate = useNavigate()
  const profile = useActiveProfile()
  const program = useStore((s) => s.program)
  const sessions = useStore((s) => s.sessions)
  const library = useStore((s) => s.exerciseLibrary)
  const targets = useStore((s) => s.muscleTargets)
  const startSession = useStore((s) => s.startSession)

  const mySessions = useMemo(
    () => sessions.filter((s) => s.profileId === profile?.id),
    [sessions, profile?.id],
  )

  const inProgress = mySessions.filter((s) => !s.completedAt)
  const suggestedId = suggestedDayId(program, sessions)
  const suggestedDay = program.days.find((d) => d.id === suggestedId)

  const completed = mySessions.filter((s) => s.completedAt)
  const lastWorkout = completed.sort((a, b) => (b.completedAt! - a.completedAt!))[0]

  const startOfWeek = useMemo(() => {
    const d = new Date()
    const day = d.getDay() // 0 = Sun
    const diff = (day + 6) % 7 // days since Monday
    d.setDate(d.getDate() - diff)
    const tz = d.getTimezoneOffset() * 60000
    return new Date(d.getTime() - tz).toISOString().slice(0, 10)
  }, [])
  const thisWeekCount = completed.filter((s) => s.date >= startOfWeek).length

  const pid = profile?.id ?? ''
  const weekVolume = useMemo(() => currentWeekVolume(sessions, pid, library), [sessions, pid, library])
  const topMuscles = useMemo(
    () =>
      Object.entries(weekVolume)
        .filter(([, v]) => v > 0)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4),
    [weekVolume],
  )
  const weekSets = useMemo(() => {
    const key = currentWeekKey()
    return sessions
      .filter((s) => s.profileId === pid && isoWeekKey(s.date) === key)
      .reduce((n, s) => n + s.exercises.reduce((m, e) => m + doneSetCount(e), 0), 0)
  }, [sessions, pid])

  const coachLine = useMemo(() => {
    const recs = weeklyRecommendations(sessions, pid, library, targets)
    const deloads = recs.filter((r) => r.action === 'deload').map((r) => muscleName(r.muscleId))
    const adds = recs
      .filter((r) => r.action === 'increase' && r.lastWeekSets > 0)
      .sort((a, b) => b.lastWeekSets - a.lastWeekSets)
      .slice(0, 3)
      .map((r) => muscleName(r.muscleId))
    const parts: string[] = []
    if (adds.length > 0) parts.push(`add a set to ${adds.join(', ')}`)
    if (deloads.length > 0) parts.push(`consider deloading ${deloads.join(', ')}`)
    return parts.length > 0 ? `Coach: ${parts.join(' · ')}` : null
  }, [sessions, pid, library, targets])

  function start(dayId: string) {
    const id = startSession(dayId)
    navigate(`/workout/${id}`)
  }

  return (
    <div className="space-y-5">
      <PageHeader title={`Hi, ${profile?.name ?? ''}`} subtitle="Ready to train?" />

      <div className="grid grid-cols-2 gap-3">
        <Stat label="This week" value={`${thisWeekCount} workout${thisWeekCount === 1 ? '' : 's'}`} accent={profile?.color} />
        <Stat label="Last workout" value={lastWorkout ? formatDate(lastWorkout.date) : '—'} />
      </div>

      {/* This week's muscle volume */}
      <section className="card space-y-3 p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">This week's volume</h2>
          <button className="text-sm font-medium text-sky-400" onClick={() => navigate('/progress?tab=muscles')}>
            View all →
          </button>
        </div>
        {topMuscles.length === 0 ? (
          <p className="text-sm text-slate-400">No sets logged yet this week — time to train.</p>
        ) : (
          <>
            <p className="text-sm text-slate-400">
              {roundVol(weekSets)} working sets · {Object.values(weekVolume).filter((v) => v > 0).length} muscles
            </p>
            <div className="space-y-2.5">
              {topMuscles.map(([id, sets]) => (
                <MuscleVolumeBar
                  key={id}
                  name={muscleName(id)}
                  sets={sets}
                  target={targets[id] ?? DEFAULT_MUSCLE_TARGETS[id]}
                />
              ))}
            </div>
          </>
        )}
        {coachLine && <p className="border-t border-slate-700/60 pt-2 text-xs text-sky-300/90">{coachLine}</p>}
      </section>

      {/* Resume any unfinished workouts */}
      {inProgress.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">In progress</h2>
          {inProgress.map((s) => (
            <button
              key={s.id}
              onClick={() => navigate(`/workout/${s.id}`)}
              className="card flex w-full items-center justify-between px-4 py-3 text-left hover:border-sky-500/60"
            >
              <div>
                <div className="font-semibold">{s.dayName}</div>
                <div className="text-xs text-slate-400">Started {formatDate(s.date)} · tap to continue</div>
              </div>
              <span className="text-sky-400">Continue →</span>
            </button>
          ))}
        </section>
      )}

      {/* Suggested next workout */}
      {program.days.length === 0 ? (
        <EmptyState icon="📋" title="No workouts yet">
          Head to the <strong>Program</strong> tab to add your first workout day.
        </EmptyState>
      ) : (
        <section className="space-y-3">
          {suggestedDay && (
            <div className="relative">
              <Buddy pose="peek" className="absolute -top-[25px] right-7 h-[27px] w-14" />
              <div className="card relative border-sky-500/40 p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-sky-400">Up next</div>
              <div className="mt-1 text-xl font-bold">{suggestedDay.name}</div>
              <div className="mt-0.5 text-sm text-slate-400">
                {suggestedDay.exercises.length} exercise{suggestedDay.exercises.length === 1 ? '' : 's'}
              </div>
              <button className="btn-primary mt-3 w-full" onClick={() => start(suggestedDay.id)}>
                Start {suggestedDay.name}
              </button>
              </div>
            </div>
          )}

          <div>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
              Or pick any day
            </h2>
            <div className="space-y-2">
              {program.days.map((d) => (
                <button
                  key={d.id}
                  onClick={() => start(d.id)}
                  className="card flex w-full items-center justify-between px-4 py-3 text-left hover:border-slate-500"
                >
                  <div>
                    <div className="font-semibold">{d.name}</div>
                    <div className="text-xs text-slate-400">
                      {d.exercises.length} exercise{d.exercises.length === 1 ? '' : 's'}
                    </div>
                  </div>
                  <span className="text-slate-400">Start →</span>
                </button>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
