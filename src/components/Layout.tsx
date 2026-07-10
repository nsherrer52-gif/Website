import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { ProfileSwitcher } from './ProfileSwitcher'
import { IconChart, IconClipboard, IconDumbbell, IconHome, IconScale, IconSliders } from './icons'

const TABS = [
  { to: '/', label: 'Today', Icon: IconHome, end: true },
  { to: '/program', label: 'Program', Icon: IconClipboard },
  { to: '/progress', label: 'Progress', Icon: IconChart },
  { to: '/body', label: 'Body', Icon: IconScale },
  { to: '/settings', label: 'Settings', Icon: IconSliders },
]

export function Layout() {
  const location = useLocation()
  // Key the content by the top-level route so it re-animates on navigation.
  const routeKey = '/' + (location.pathname.split('/')[1] ?? '')

  return (
    <div className="mx-auto flex min-h-full max-w-2xl flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-slate-700/60 bg-slate-900/90 px-4 py-3 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-sky-500 text-slate-950">
            <IconDumbbell className="h-4.5 w-4.5" />
          </span>
          <span className="font-[family-name:var(--font-display)] text-[15px] font-bold tracking-tight">
            Gym Tracker
          </span>
        </div>
        <ProfileSwitcher />
      </header>

      {/* Page content */}
      <main className="flex-1 px-4 py-5 pb-28">
        <div key={routeKey} className="page-enter">
          <Outlet />
        </div>
      </main>

      {/* Bottom navigation (mobile-first) */}
      <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-slate-700/60 bg-slate-900/95 backdrop-blur-md">
        <div
          className="mx-auto grid max-w-2xl grid-cols-5 px-1 pt-1"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          {TABS.map(({ to, label, Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `mx-auto flex w-full flex-col items-center gap-1 rounded-lg py-2 text-[10px] font-semibold uppercase tracking-[0.08em] transition ${
                  isActive ? 'text-sky-500' : 'text-slate-500 hover:text-slate-300'
                }`
              }
            >
              <Icon className="h-5 w-5" />
              {label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
