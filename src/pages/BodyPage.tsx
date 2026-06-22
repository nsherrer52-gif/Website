import { useMemo, useState } from 'react'
import { useStore, useActiveProfile } from '../store/useStore'
import { todayISO, formatDate } from '../lib/date'
import { round1 } from '../lib/stats'
import { PageHeader, EmptyState } from '../components/ui'
import { LineChartCard, type ChartPoint } from '../components/LineChartCard'

export function BodyPage() {
  const profile = useActiveProfile()
  const allBody = useStore((s) => s.body)
  const fields = useStore((s) => s.measurementFields)
  const addBodyEntry = useStore((s) => s.addBodyEntry)
  const updateBodyEntry = useStore((s) => s.updateBodyEntry)
  const deleteBodyEntry = useStore((s) => s.deleteBodyEntry)

  const entries = useMemo(
    () =>
      allBody
        .filter((b) => b.profileId === profile?.id)
        .sort((a, b) => b.date.localeCompare(a.date)),
    [allBody, profile?.id],
  )

  // --- The add / edit form ---------------------------------------------------
  const [date, setDate] = useState(todayISO())
  const [weight, setWeight] = useState('')
  const [meas, setMeas] = useState<Record<string, string>>({})
  const [editingId, setEditingId] = useState<string | null>(null)

  function reset() {
    setDate(todayISO())
    setWeight('')
    setMeas({})
    setEditingId(null)
  }

  function loadForEdit(id: string) {
    const e = entries.find((x) => x.id === id)
    if (!e) return
    setEditingId(id)
    setDate(e.date)
    setWeight(e.weight != null ? String(e.weight) : '')
    const m: Record<string, string> = {}
    for (const [k, v] of Object.entries(e.measurements)) m[k] = String(v)
    setMeas(m)
  }

  function save() {
    const measurements: Record<string, number> = {}
    for (const f of fields) {
      const raw = meas[f]
      if (raw != null && raw.trim() !== '' && Number.isFinite(Number(raw))) {
        measurements[f] = Number(raw)
      }
    }
    const w = weight.trim() === '' ? undefined : Number(weight)
    const payload = {
      date,
      weight: w != null && Number.isFinite(w) ? w : undefined,
      measurements,
    }
    if (editingId) updateBodyEntry(editingId, payload)
    else addBodyEntry(payload)
    reset()
  }

  const hasInput = weight.trim() !== '' || Object.values(meas).some((v) => v.trim() !== '')

  // --- Chart data ------------------------------------------------------------
  const chrono = useMemo(() => [...entries].sort((a, b) => a.date.localeCompare(b.date)), [entries])

  const weightPoints: ChartPoint[] = chrono
    .filter((e) => e.weight != null)
    .map((e) => ({ label: e.date.slice(5).replace('-', '/'), value: e.weight! }))

  const fieldCharts = fields
    .map((f) => ({
      field: f,
      points: chrono
        .filter((e) => e.measurements[f] != null)
        .map((e) => ({ label: e.date.slice(5).replace('-', '/'), value: e.measurements[f] })),
    }))
    .filter((c) => c.points.length > 0)

  return (
    <div className="space-y-5">
      <PageHeader title="Body" subtitle="Track bodyweight and measurements over time." />

      {/* Add / edit form */}
      <div className="card space-y-3 p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">{editingId ? 'Edit entry' : 'Log entry'}</h2>
          {editingId && (
            <button className="text-xs text-slate-400 underline" onClick={reset}>
              Cancel edit
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Date</label>
            <input
              type="date"
              className="input"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Bodyweight ({profile?.unit})</label>
            <input
              type="number"
              inputMode="decimal"
              className="input"
              placeholder="—"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
            />
          </div>
        </div>

        {fields.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            {fields.map((f) => (
              <div key={f}>
                <label className="label">{f}</label>
                <input
                  type="number"
                  inputMode="decimal"
                  className="input"
                  placeholder="—"
                  value={meas[f] ?? ''}
                  onChange={(e) => setMeas((m) => ({ ...m, [f]: e.target.value }))}
                />
              </div>
            ))}
          </div>
        )}

        <p className="text-xs text-slate-500">
          Manage which measurements appear here in <strong>Settings</strong>.
        </p>

        <button className="btn-primary w-full" disabled={!hasInput} onClick={save}>
          {editingId ? 'Save changes' : 'Add entry'}
        </button>
      </div>

      {/* Charts */}
      <LineChartCard title="Bodyweight" unit={profile?.unit} color={profile?.color} data={weightPoints} />
      {fieldCharts.map((c) => (
        <LineChartCard key={c.field} title={c.field} color={profile?.color} data={c.points} />
      ))}

      {/* Entry list */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">History</h2>
        {entries.length === 0 ? (
          <EmptyState icon="⚖️" title="No entries yet">
            Log your bodyweight above to start tracking.
          </EmptyState>
        ) : (
          entries.map((e) => (
            <div key={e.id} className="card flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <div className="font-semibold">{formatDate(e.date)}</div>
                <div className="truncate text-xs text-slate-400">
                  {[
                    e.weight != null ? `${round1(e.weight)} ${profile?.unit}` : null,
                    ...Object.entries(e.measurements).map(([k, v]) => `${k} ${v}`),
                  ]
                    .filter(Boolean)
                    .join(' · ') || '—'}
                </div>
              </div>
              <div className="flex shrink-0 gap-1">
                <button className="btn-ghost px-3 py-1.5 text-xs" onClick={() => loadForEdit(e.id)}>
                  Edit
                </button>
                <button
                  className="btn-ghost px-3 py-1.5 text-xs hover:text-rose-400"
                  onClick={() => confirm('Delete this entry?') && deleteBodyEntry(e.id)}
                >
                  ✕
                </button>
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  )
}
