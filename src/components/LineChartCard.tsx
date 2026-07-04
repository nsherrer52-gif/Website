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

interface Row {
  label: string
  value?: number
  projected?: number
}

/**
 * A small reusable line chart in a card. Renders a friendly empty state when
 * there isn't enough data yet. When `projection` points are supplied they are
 * drawn as a dashed continuation of the line (a forecast).
 */
export function LineChartCard({
  title,
  unit,
  color = '#38bdf8',
  data,
  projection,
  trendNote,
}: {
  title: string
  unit?: string
  color?: string
  data: ChartPoint[]
  projection?: ChartPoint[]
  trendNote?: string
}) {
  if (data.length === 0) {
    return (
      <EmptyState icon="📈" title={title}>
        Log a couple of entries and your progress will chart here.
      </EmptyState>
    )
  }

  const rows: Row[] = data.map((d) => ({ label: d.label, value: d.value }))
  if (projection && projection.length > 0) {
    // Bridge the dashed line to the last actual point so they connect.
    rows[rows.length - 1] = { ...rows[rows.length - 1], projected: data[data.length - 1].value }
    for (const p of projection) rows.push({ label: p.label, projected: p.value })
  }

  return (
    <div className="card p-4">
      <div className="mb-3 flex items-baseline justify-between">
        <h3 className="font-semibold">{title}</h3>
        {unit && <span className="text-xs text-slate-400">{unit}</span>}
      </div>
      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={rows} margin={{ top: 5, right: 8, left: -16, bottom: 0 }}>
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
              name="actual"
              stroke={color}
              strokeWidth={2.5}
              dot={{ r: 3, fill: color }}
              activeDot={{ r: 5 }}
              isAnimationActive={false}
            />
            {projection && projection.length > 0 && (
              <Line
                type="monotone"
                dataKey="projected"
                name="projected"
                stroke={color}
                strokeOpacity={0.55}
                strokeWidth={2}
                strokeDasharray="6 5"
                dot={false}
                isAnimationActive={false}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
      {trendNote && <p className="mt-2 text-xs text-slate-400">{trendNote}</p>}
    </div>
  )
}
