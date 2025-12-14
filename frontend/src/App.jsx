import React, { useEffect, useMemo, useState } from 'react'
import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom'
import UIAuth from './pages/UIAuth'
import UIDashboard from './pages/UIDashboard'
import UILibrary from './pages/UILibrary'
import UIProblemDetail from './pages/UIProblemDetail'

const navItems = [
  { label: 'Dashboard', path: '/dashboard', icon: '📊' },
  { label: 'Problems', path: '/problem', icon: '🧠' },
  { label: 'Library', path: '/library', icon: '📚' },
  { label: 'Assessments', path: '/assessments', icon: '✅', disabled: true },
  { label: 'Discussions', path: '/discussions', icon: '💬', disabled: true },
]

function useTheme() {
  const [theme, setTheme] = useState(() => {
    const stored = localStorage.getItem('ea-theme')
    if (stored) return stored
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('ea-theme', theme)
  }, [theme])

  const toggle = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))
  return { theme, toggle }
}

function Shell({ children, theme, toggle }) {
  const location = useLocation()
  return (
    <div className="min-h-screen text-[var(--text)] bg-[var(--bg)]">
      <div className="flex">
        <aside className="hidden lg:flex w-64 min-h-screen flex-col gap-6 px-6 py-6 bg-[var(--surface)] border-r border-[var(--stroke)] backdrop-blur-glass shadow-glass">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-grad-hero" />
            <div>
              <p className="text-sm text-[var(--muted)]">Electronics astra</p>
              <p className="text-lg font-semibold">Learning Platform</p>
            </div>
          </div>
          <nav className="flex flex-col gap-2">
            {navItems.map((item) => {
              const active = location.pathname === item.path
              return (
                <Link
                  key={item.path}
                  to={item.disabled ? '#' : item.path}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition ${
                    active
                      ? 'bg-gradient-to-r from-primary/70 to-primary2/70 text-white shadow-glass'
                      : 'hover:bg-[var(--surface-strong)] text-[var(--text)]'
                  } ${item.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <span className="text-base">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>
          <div className="mt-auto rounded-xl border border-[var(--stroke)] bg-[var(--surface)] p-4">
            <p className="text-sm text-[var(--muted)]">Track</p>
            <p className="text-base font-semibold">Electronics Mastery</p>
            <div className="mt-3 h-2 rounded-full bg-[var(--stroke)]">
              <div className="h-full w-3/4 rounded-full bg-gradient-to-r from-primary to-accent" />
            </div>
            <p className="mt-2 text-xs text-[var(--muted)]">75% of weekly plan</p>
          </div>
        </aside>

        <div className="flex-1 min-w-0">
          <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-[var(--stroke)] bg-[var(--surface)]/80 backdrop-blur-glass px-4 py-3 shadow-glass">
            <div className="flex items-center gap-2 rounded-xl border border-[var(--stroke)] bg-[var(--surface)] px-3 py-2">
              <span className="text-xs text-[var(--muted)]">Status</span>
              <span className="text-xs font-semibold text-green-400">Live</span>
            </div>
            <div className="flex-1">
              <div className="relative">
                <input
                  className="w-full rounded-xl border border-[var(--stroke)] bg-[var(--surface)] px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  placeholder="Search circuits, signals, embedded..."
                  aria-label="Search"
                />
                <span className="absolute right-3 top-2 text-[var(--muted)] text-sm">⌘K</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={toggle}
                className="rounded-xl border border-[var(--stroke)] bg-[var(--surface)] px-3 py-2 text-sm font-semibold"
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
              </button>
              <Link
                to="/library"
                className="button-primary hidden md:inline-flex items-center gap-2"
              >
                ⬆ Upload
              </Link>
            </div>
          </header>

          <main className="px-4 py-6 lg:px-8 space-y-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const { theme, toggle } = useTheme()
  return (
    <Shell theme={theme} toggle={toggle}>
      <Routes>
        <Route path="/" element={<Navigate to="/auth" replace />} />
        <Route path="/auth" element={<UIAuth />} />
        <Route path="/dashboard" element={<UIDashboard />} />
        <Route path="/library" element={<UILibrary />} />
        <Route path="/problem" element={<UIProblemDetail />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Shell>
  )
}
