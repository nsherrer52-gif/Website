import type { ReactNode } from 'react'

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string
  subtitle?: string
  action?: ReactNode
}) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-slate-400">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

export function EmptyState({ icon, title, children }: { icon: string; title: string; children?: ReactNode }) {
  return (
    <div className="card flex flex-col items-center gap-2.5 px-6 py-10 text-center">
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-700/40 text-lg">
        {icon}
      </div>
      <h3 className="text-base font-semibold">{title}</h3>
      {children && <p className="max-w-sm text-sm text-slate-400">{children}</p>}
    </div>
  )
}

export function Stat({ label, value, accent }: { label: string; value: ReactNode; accent?: string }) {
  return (
    <div className="card px-4 py-3">
      <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-slate-500">{label}</div>
      <div
        className="mt-1 font-[family-name:var(--font-display)] text-xl font-bold tabular-nums"
        style={accent ? { color: accent } : undefined}
      >
        {value}
      </div>
    </div>
  )
}

/** Small "PR" tag shown when an exercise set a new personal record. */
export function PRBadge() {
  return (
    <span
      title="New personal record"
      className="chip border border-amber-400/50 bg-amber-400/10 text-amber-400"
    >
      PR
    </span>
  )
}
