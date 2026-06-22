import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore, useActiveProfile } from '../store/useStore'
import { suggestedDayId } from '../lib/rotation'
import { formatDate } from '../lib/date'
import { PageHeader, EmptyState, Stat } from '../components/ui'

export function TodayPage() {
  const navigate = useNavigate()
  const profile = useActiveProfile()
  const program = useStore((s) => s.program)
  const sessions = useStore((s) => s.sessions)
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

  function start(dayId: string) {
    const id = startSession(dayId)
    navigate(`/workout/${id}`)
  }

  return (
    <div className="space-y-5">
      <PageHeader title={`Hi, ${profile?.name ?? ''} 👋`} subtitle="Ready to train?" />

      <div className="grid grid-cols-2 gap-3">
        <Stat label="This week" value={`${thisWeekCount} workout${thisWeekCount === 1 ? '' : 's'}`} accent={profile?.color} />
        <Stat label="Last workout" value={lastWorkout ? formatDate(lastWorkout.date) : '—'} />
      </div>

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
            <div className="card border-sky-500/40 p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-sky-400">Up next</div>
              <div className="mt-1 text-xl font-bold">{suggestedDay.name}</div>
              <div className="mt-0.5 text-sm text-slate-400">
                {suggestedDay.exercises.length} exercise{suggestedDay.exercises.length === 1 ? '' : 's'}
              </div>
              <button className="btn-primary mt-3 w-full" onClick={() => start(suggestedDay.id)}>
                Start {suggestedDay.name}
              </button>
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
