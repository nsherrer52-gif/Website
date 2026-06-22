import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { ProfileSwitcher } from './ProfileSwitcher'

const TABS = [
  { to: '/', label: 'Today', icon: '🏋️', end: true },
  { to: '/program', label: 'Program', icon: '📋' },
  { to: '/progress', label: 'Progress', icon: '📈' },
  { to: '/body', label: 'Body', icon: '⚖️' },
  { to: '/settings', label: 'Settings', icon: '⚙️' },
]

export function Layout() {
  const location = useLocation()
  // Key the content by the top-level route so it re-animates on navigation.
  const routeKey = '/' + (location.pathname.split('/')[1] ?? '')

  return (
    <div className="mx-auto flex min-h-full max-w-2xl flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-slate-800/80 bg-slate-900/70 px-4 py-3 backdrop-blur-md">
        <div className="flex items-center gap-2 font-bold tracking-tight">
          <span className="text-xl">🏋️</span>
          <span className="bg-gradient-to-r from-sky-300 to-sky-500 bg-clip-text text-transparent">
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
      <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-slate-800/80 bg-slate-900/85 backdrop-blur-md">
        <div
          className="mx-auto grid max-w-2xl grid-cols-5 px-1 pt-1"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          {TABS.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.end}
              className={({ isActive }) =>
                `mx-auto flex w-full flex-col items-center gap-0.5 rounded-xl py-2 text-[11px] font-medium transition ${
                  isActive
                    ? 'bg-sky-500/10 text-sky-400'
                    : 'text-slate-400 hover:text-slate-200'
                }`
              }
            >
              <span className="text-lg leading-none">{tab.icon}</span>
              {tab.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
