import type { MuscleContribution } from '../types'
import { MUSCLES } from '../lib/muscles'
import { resolveMuscles } from '../lib/exerciseLibrary'

/**
 * Grid of all muscles for assigning an exercise's contributions. Tapping a
 * muscle cycles none → full (1) → half (½) → none.
 */
export function MuscleEditor({
  name,
  value,
  onChange,
  onSaveToLibrary,
}: {
  name: string
  value: MuscleContribution | undefined
  onChange: (m: MuscleContribution) => void
  onSaveToLibrary?: () => void
}) {
  const map = value ?? {}

  function cycle(id: string) {
    const cur = map[id] ?? 0
    const next = cur === 0 ? 1 : cur === 1 ? 0.5 : 0
    const m = { ...map }
    if (next === 0) delete m[id]
    else m[id] = next
    onChange(m)
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-3 gap-1.5">
        {MUSCLES.map((mu) => {
          const v = map[mu.id] ?? 0
          const active = v > 0
          return (
            <button
              key={mu.id}
              type="button"
              onClick={() => cycle(mu.id)}
              className={`relative rounded-lg border px-2 py-1.5 text-xs font-medium transition ${
                active
                  ? 'border-sky-500 bg-sky-500/15 text-sky-200'
                  : 'border-slate-700 bg-slate-900/40 text-slate-400'
              }`}
            >
              {mu.name}
              {active && (
                <span className="ml-1 font-bold text-sky-300">{v === 1 ? '1' : '½'}</span>
              )}
            </button>
          )
        })}
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="btn-ghost px-3 py-1.5 text-xs"
          onClick={() => onChange(resolveMuscles(name))}
        >
          ↻ Auto-fill from library
        </button>
        {onSaveToLibrary && (
          <button type="button" className="btn-ghost px-3 py-1.5 text-xs" onClick={onSaveToLibrary}>
            Save to library
          </button>
        )}
      </div>
      <p className="text-xs text-slate-500">Tap a muscle to cycle: full (1) → half (½) → off.</p>
    </div>
  )
}
