import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatShort } from '../lib/date'
import { EmptyState } from './ui'

export interface CompareSeries {
  name: string
  color: string
  points: { date: string; value: number }[]
}

/**
 * Two (or more) people's trends for the same exercise on one chart, one line
 * per person in their profile color. Rows are merged by date; gaps connect.
 */
export function CompareChart({ series, unit }: { series: CompareSeries[]; unit?: string }) {
  const withData = series.filter((s) => s.points.length > 0)
  if (withData.length === 0) {
    return (
      <EmptyState icon="⚔️" title="No shared data yet">
        Once both of you have logged this exercise, the race shows up here.
      </EmptyState>
    )
  }

  // Merge on the union of dates so differently-timed sessions still line up.
  const dates = [...new Set(withData.flatMap((s) => s.points.map((p) => p.date)))].sort()
  const rows = dates.map((date) => {
    const row: Record<string, string | number> = { label: formatShort(date) }
    for (const s of withData) {
      const pt = s.points.find((p) => p.date === date)
      if (pt) row[s.name] = pt.value
    }
    return row
  })

  return (
    <div className="card p-4">
      <div className="mb-3 flex items-baseline justify-between">
        <h3 className="font-semibold">Head to head</h3>
        {unit && <span className="text-xs text-slate-400">{unit}</span>}
      </div>
      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={rows} margin={{ top: 5, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#242933" vertical={false} />
            <XAxis dataKey="label" stroke="#5a6472" fontSize={11} tickMargin={8} />
            <YAxis stroke="#5a6472" fontSize={11} domain={['auto', 'auto']} width={44} />
            <Tooltip
              contentStyle={{
                background: '#0b0d10',
                border: '1px solid #242933',
                borderRadius: 12,
                color: '#e2e8f0',
              }}
              labelStyle={{ color: '#8c95a3' }}
            />
            <Legend
              wrapperStyle={{ fontSize: 12 }}
              formatter={(value) => <span style={{ color: '#c0c7d1' }}>{value}</span>}
            />
            {withData.map((s) => (
              <Line
                key={s.name}
                type="monotone"
                dataKey={s.name}
                stroke={s.color}
                strokeWidth={2.5}
                dot={{ r: 3, fill: s.color }}
                activeDot={{ r: 5 }}
                connectNulls
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
