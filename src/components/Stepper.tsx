/**
 * A number input with big − / + buttons for fast, one-handed entry during a
 * workout. Still fully typeable. Empty value is represented as null.
 */
export function Stepper({
  value,
  onChange,
  step = 1,
  min = 0,
  placeholder = '—',
  ariaLabel,
}: {
  value: number | null
  onChange: (v: number | null) => void
  step?: number
  min?: number
  placeholder?: string
  ariaLabel?: string
}) {
  function bump(dir: -1 | 1) {
    const base = value ?? 0
    const next = Math.max(min, Math.round((base + dir * step) * 100) / 100)
    onChange(next)
  }

  function parse(raw: string): number | null {
    if (raw.trim() === '') return null
    const n = Number(raw)
    return Number.isFinite(n) ? n : null
  }

  return (
    <div className="flex items-stretch overflow-hidden rounded-xl border border-slate-700 bg-slate-900/70">
      <button
        type="button"
        aria-label={ariaLabel ? `Decrease ${ariaLabel}` : 'Decrease'}
        onClick={() => bump(-1)}
        className="w-9 shrink-0 text-lg font-bold text-slate-300 transition active:bg-slate-700"
      >
        −
      </button>
      <input
        type="number"
        inputMode="decimal"
        aria-label={ariaLabel}
        placeholder={placeholder}
        value={value ?? ''}
        onChange={(e) => onChange(parse(e.target.value))}
        className="w-full min-w-0 border-x border-slate-700 bg-transparent py-2 text-center text-slate-100 outline-none focus:bg-slate-800/60"
      />
      <button
        type="button"
        aria-label={ariaLabel ? `Increase ${ariaLabel}` : 'Increase'}
        onClick={() => bump(1)}
        className="w-9 shrink-0 text-lg font-bold text-slate-300 transition active:bg-slate-700"
      >
        +
      </button>
    </div>
  )
}
