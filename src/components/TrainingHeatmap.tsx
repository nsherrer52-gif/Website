import { useMemo } from 'react'
import type { ID, Session } from '../types'
import { dailySetCounts } from '../lib/consistency'
import { formatDate } from '../lib/date'

// Cell color by completed sets that day (graphite → lime ramp).
function cellColor(sets: number): string {
  if (sets <= 0) return '#20242b'
  if (sets < 6) return '#2c3a1a'
  if (sets < 12) return '#4d7c0f'
  if (sets < 18) return '#84cc16'
  return '#a3e635'
}

/**
 * GitHub-style training consistency grid: ~20 weeks of days (columns = weeks,
 * rows = Mon–Sun), colored by completed sets per day.
 */
export function TrainingHeatmap({ sessions, profileId }: { sessions: Session[]; profileId: ID }) {
  const weeks = useMemo(() => {
    const days = dailySetCounts(sessions, profileId, 140)
    const out: (typeof days)[] = []
    for (let i = 0; i < days.length; i += 7) out.push(days.slice(i, i + 7))
    return out
  }, [sessions, profileId])

  return (
    <div className="card p-4">
      <div className="mb-3 flex items-baseline justify-between">
        <h3 className="font-semibold">Consistency</h3>
        <span className="text-xs text-slate-500">last 20 weeks</span>
      </div>
      <div className="flex justify-between gap-[3px]" role="img" aria-label="Training days heatmap">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-1 flex-col gap-[3px]">
            {week.map((day) => (
              <div
                key={day.date}
                title={`${formatDate(day.date)}: ${day.sets} set${day.sets === 1 ? '' : 's'}`}
                className="aspect-square w-full rounded-[2px]"
                style={{ backgroundColor: cellColor(day.sets) }}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-end gap-1.5 text-[10px] uppercase tracking-[0.1em] text-slate-500">
        Less
        {[0, 6, 12, 18].map((n) => (
          <span key={n} className="h-2.5 w-2.5 rounded-[2px]" style={{ backgroundColor: cellColor(n) }} />
        ))}
        More
      </div>
    </div>
  )
}
