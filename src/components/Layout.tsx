import { NavLink, Outlet } from 'react-router-dom'
import { ProfileSwitcher } from './ProfileSwitcher'

const TABS = [
  { to: '/', label: 'Today', icon: '🏋️', end: true },
  { to: '/program', label: 'Program', icon: '📋' },
  { to: '/progress', label: 'Progress', icon: '📈' },
  { to: '/body', label: 'Body', icon: '⚖️' },
  { to: '/settings', label: 'Settings', icon: '⚙️' },
]

export function Layout() {
  return (
    <div className="mx-auto flex min-h-full max-w-2xl flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-slate-800 bg-slate-900/80 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-2 font-bold tracking-tight">
          <span className="text-xl">🏋️</span>
          <span>Gym Tracker</span>
        </div>
        <ProfileSwitcher />
      </header>

      {/* Page content */}
      <main className="flex-1 px-4 py-5 pb-28">
        <Outlet />
      </main>

      {/* Bottom navigation (mobile-first) */}
      <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-slate-800 bg-slate-900/95 backdrop-blur">
        <div
          className="mx-auto grid max-w-2xl grid-cols-5"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          {TABS.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.end}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition ${
                  isActive ? 'text-sky-400' : 'text-slate-400 hover:text-slate-200'
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
