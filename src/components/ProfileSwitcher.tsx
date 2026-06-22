import { useStore, useActiveProfile } from '../store/useStore'

/** Compact dropdown in the header to switch the active person. */
export function ProfileSwitcher() {
  const profiles = useStore((s) => s.profiles)
  const active = useActiveProfile()
  const setActiveProfile = useStore((s) => s.setActiveProfile)

  return (
    <div className="flex items-center gap-2">
      <span
        className="h-3 w-3 shrink-0 rounded-full"
        style={{ backgroundColor: active?.color ?? '#38bdf8' }}
        aria-hidden
      />
      <select
        aria-label="Active profile"
        value={active?.id ?? ''}
        onChange={(e) => setActiveProfile(e.target.value)}
        className="rounded-lg border border-slate-700 bg-slate-800 px-2 py-1.5 text-sm font-semibold outline-none focus:border-sky-500"
      >
        {profiles.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
    </div>
  )
}
