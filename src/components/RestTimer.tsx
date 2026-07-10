import { useEffect, useState } from 'react'

/**
 * Floating rest countdown pill, shown above the bottom nav during a workout.
 * Starts when a set is checked off; vibrates (where supported) when time's up.
 */
export function RestTimer({
  endsAt,
  onExtend,
  onDismiss,
}: {
  endsAt: number
  onExtend: (ms: number) => void
  onDismiss: () => void
}) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(t)
  }, [])

  const remaining = Math.max(0, Math.ceil((endsAt - now) / 1000))
  const done = remaining <= 0

  // Buzz once when the countdown crosses zero, then auto-dismiss shortly after.
  useEffect(() => {
    if (!done) return
    try {
      navigator.vibrate?.([200, 100, 200])
    } catch {
      /* not supported */
    }
    const t = setTimeout(onDismiss, 6000)
    return () => clearTimeout(t)
  }, [done, onDismiss])

  const mins = Math.floor(remaining / 60)
  const secs = remaining % 60

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-20 z-20 flex justify-center px-4">
      <div
        className={`pointer-events-auto flex items-center gap-3 rounded-full border px-4 py-2 shadow-lg backdrop-blur-md ${
          done
            ? 'border-emerald-500/60 bg-emerald-500/20 text-emerald-300'
            : 'border-sky-500/50 bg-slate-900/90 text-slate-100'
        }`}
      >
        <span className="text-lg" aria-hidden>
          ⏱
        </span>
        {done ? (
          <span className="font-bold">Rest over — go! 💪</span>
        ) : (
          <span className="min-w-12 text-center font-mono text-lg font-bold tabular-nums">
            {mins}:{String(secs).padStart(2, '0')}
          </span>
        )}
        {!done && (
          <button
            className="rounded-full bg-slate-700/70 px-2.5 py-1 text-xs font-semibold hover:bg-slate-700"
            onClick={() => onExtend(30_000)}
          >
            +30s
          </button>
        )}
        <button
          aria-label="Dismiss rest timer"
          className="text-slate-400 hover:text-slate-200"
          onClick={onDismiss}
        >
          ✕
        </button>
      </div>
    </div>
  )
}
