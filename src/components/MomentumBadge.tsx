import type { MomentumLevel } from '../lib/momentum'

const STYLES: Record<
  MomentumLevel,
  { arrow: string; label: string; cls: string }
> = {
  surge: { arrow: '▲▲', label: 'Surging', cls: 'border-sky-500/50 bg-sky-500/15 text-sky-400' },
  gain: { arrow: '▲', label: 'Gaining', cls: 'border-sky-600/40 bg-sky-600/10 text-sky-500' },
  hold: { arrow: '►', label: 'Holding', cls: 'border-slate-600/60 bg-slate-700/30 text-slate-300' },
  slip: { arrow: '▼', label: 'Falling', cls: 'border-rose-500/40 bg-rose-500/10 text-rose-400' },
}

/**
 * Momentum chip: your performance vs the app's own rep predictions.
 * `compact` renders just the arrow (for tight spots like exercise headers).
 */
export function MomentumBadge({
  level,
  compact = false,
}: {
  level: MomentumLevel
  compact?: boolean
}) {
  const s = STYLES[level]
  return (
    <span
      title={`${s.label} — vs the app's rep predictions`}
      className={`chip border ${s.cls}`}
    >
      {s.arrow}
      {!compact && <span className="ml-1">{s.label}</span>}
    </span>
  )
}
