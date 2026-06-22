import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { EmptyState } from './ui'

export interface ChartPoint {
  /** X-axis label (already formatted, e.g. "6/22"). */
  label: string
  value: number
}

/**
 * A small reusable line chart in a card. Renders a friendly empty state when
 * there isn't enough data yet.
 */
export function LineChartCard({
  title,
  unit,
  color = '#38bdf8',
  data,
}: {
  title: string
  unit?: string
  color?: string
  data: ChartPoint[]
}) {
  if (data.length === 0) {
    return (
      <EmptyState icon="📈" title={title}>
        Log a couple of entries and your progress will chart here.
      </EmptyState>
    )
  }

  return (
    <div className="card p-4">
      <div className="mb-3 flex items-baseline justify-between">
        <h3 className="font-semibold">{title}</h3>
        {unit && <span className="text-xs text-slate-400">{unit}</span>}
      </div>
      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
            <XAxis dataKey="label" stroke="#64748b" fontSize={11} tickMargin={8} />
            <YAxis stroke="#64748b" fontSize={11} domain={['auto', 'auto']} width={44} />
            <Tooltip
              contentStyle={{
                background: '#0f172a',
                border: '1px solid #334155',
                borderRadius: 12,
                color: '#e2e8f0',
              }}
              labelStyle={{ color: '#94a3b8' }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2.5}
              dot={{ r: 3, fill: color }}
              activeDot={{ r: 5 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
