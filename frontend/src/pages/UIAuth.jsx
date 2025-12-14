import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api/axiosInstance'

export default function UIAuth() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || !password) {
      setError('Please enter email and password')
      return
    }
    try {
      setLoading(true)
      setError('')
      await api.post('/api/auth/login', { email, password })
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-[calc(100vh-96px)] overflow-hidden">
      <div className="absolute inset-0 bg-grad-hero opacity-60 blur-3xl" aria-hidden />
      <div className="relative mx-auto flex max-w-5xl flex-col gap-8 rounded-2xl border border-[var(--stroke)] bg-[var(--surface)]/80 p-8 shadow-glass backdrop-blur-glass md:flex-row">
        <div className="flex-1 space-y-4">
          <p className="text-sm font-semibold text-[var(--muted)]">Welcome to</p>
          <h1 className="text-3xl font-semibold leading-tight">
            Electronics astra
            <span className="block text-lg text-[var(--muted)]">A LeetCode-style lab for circuits, signals, embedded, and VLSI.</span>
          </h1>
          <div className="grid gap-3 sm:grid-cols-2">
            {['Curated problem sets', 'Live analytics', 'Uploads & library', 'Assessments'].map((item) => (
              <div
                key={item}
                className="rounded-xl border border-[var(--stroke)] bg-[var(--surface)] px-4 py-3 text-sm font-medium text-[var(--text)]"
              >
                {item}
              </div>
            ))}
          </div>
          <div className="rounded-xl border border-[var(--stroke)] bg-[var(--surface)] p-4">
            <p className="text-sm text-[var(--muted)]">Today</p>
            <p className="text-lg font-semibold">Continue your streak: Signals → Sampling Theorem</p>
            <div className="mt-3 h-2 rounded-full bg-[var(--stroke)]">
              <div className="h-full w-1/2 rounded-full bg-gradient-to-r from-primary to-accent" />
            </div>
          </div>
        </div>

        <div className="flex-1">
          <div className="glass rounded-2xl p-6 shadow-soft">
            <div className="flex items-center justify-between">
              <p className="text-lg font-semibold">Login</p>
              <span className="rounded-full bg-[var(--surface-strong)] px-3 py-1 text-xs text-[var(--muted)]">Student</span>
            </div>
            <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="text-sm text-[var(--muted)]">Email</label>
                <input
                  className="input mt-1"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="text-sm text-[var(--muted)]">Password</label>
                <input
                  className="input mt-1"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div className="flex items-center justify-between text-sm text-[var(--muted)]">
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="rounded border-[var(--stroke)] bg-[var(--surface)]" />
                  Remember me
                </label>
                <Link to="/auth" className="text-primary font-medium">Forgot?</Link>
              </div>
              {error && (
                <div className="rounded-xl border border-[var(--stroke)] bg-[var(--surface-strong)] px-3 py-2 text-sm text-red-300">
                  {error}
                </div>
              )}
              <button type="submit" className="button-primary w-full" disabled={loading}>
                {loading ? 'Signing in…' : 'Sign in'}
              </button>
              <button
                type="button"
                className="button-ghost w-full text-[var(--text)]"
                onClick={() => navigate('/auth?mode=signup')}
              >
                Sign up
              </button>
            </form>
            <div className="mt-4 text-center text-xs text-[var(--muted)]">
              Continue with SSO · Microsoft · Google
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
