import { useEffect, useState } from 'react'
import { IconTimer } from './icons'
import { beep } from '../lib/beep'

/** Best-effort system notification when the app isn't visible. */
function notifyRestOver() {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return
  navigator.serviceWorker?.ready
    .then((reg) =>
      reg.showNotification('Rest over — go!', {
        body: 'Time for your next set.',
        tag: 'rest-timer', // repeats replace instead of stacking
        icon: './icon.svg',
      }),
    )
    .catch(() => {})
}

/**
 * Floating rest countdown pill, shown above the bottom nav during a workout.
 * Starts when a set is checked off. On completion: vibrates, optionally beeps,
 * and — if the app is hidden — fires a system notification (reliable on
 * Android; iOS suspends background web apps, so there it alerts as soon as
 * the app becomes visible again).
 */
export function RestTimer({
  endsAt,
  sound,
  onExtend,
  onDismiss,
}: {
  endsAt: number
  sound: boolean
  onExtend: (ms: number) => void
  onDismiss: () => void
}) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 250)
    // Catch up immediately when the app returns to the foreground.
    const onVis = () => setNow(Date.now())
    document.addEventListener('visibilitychange', onVis)
    return () => {
      clearInterval(t)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [])

  const remaining = Math.max(0, Math.ceil((endsAt - now) / 1000))
  const done = remaining <= 0

  // Alert once when the countdown crosses zero, then auto-dismiss shortly after.
  useEffect(() => {
    if (!done) return
    try {
      navigator.vibrate?.([200, 100, 200])
    } catch {
      /* not supported */
    }
    if (sound) beep()
    if (document.hidden) notifyRestOver()
    const t = setTimeout(onDismiss, 6000)
    return () => clearTimeout(t)
  }, [done, sound, onDismiss])

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
        <IconTimer className="h-[18px] w-[18px] text-sky-400" />
        {done ? (
          <span className="font-bold">Rest over — go!</span>
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
