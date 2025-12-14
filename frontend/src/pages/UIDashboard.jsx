import React from 'react'
import { Link } from 'react-router-dom'

const stats = [
  { label: 'Problems Solved', value: '142', trend: '+12 this week' },
  { label: 'Streak', value: '18 days', trend: 'On track' },
  { label: 'Accuracy', value: '87%', trend: '+4% vs last week' },
  { label: 'Time on Platform', value: '12.4h', trend: '+1.2h' },
]

const domains = [
  { name: 'Circuits', progress: 78, color: 'from-primary to-primary2' },
  { name: 'Signals', progress: 62, color: 'from-primary to-accent' },
  { name: 'Embedded', progress: 54, color: 'from-primary2 to-accent' },
  { name: 'VLSI', progress: 36, color: 'from-primary to-primary/50' },
  { name: 'Power', progress: 44, color: 'from-primary2 to-primary/60' },
]

const events = [
  { title: 'Lab: Op-Amp Filters', time: 'Today · 4:00 PM', tag: 'Lab' },
  { title: 'Workshop: FPGA Basics', time: 'Tomorrow · 6:30 PM', tag: 'Workshop' },
  { title: 'Quiz: Signals Sampling', time: 'Fri · 9:00 AM', tag: 'Quiz' },
]

const activity = [
  { title: 'Submitted: ADC Calibration', time: '2h ago' },
  { title: 'Started: PLL Phase Noise', time: '4h ago' },
  { title: 'Uploaded: Lab Report – Filters', time: 'Yesterday' },
]

export default function UIDashboard() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-[2fr_1.2fr]">
        <div className="glass rounded-2xl p-6 shadow-soft">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm text-[var(--muted)]">This week</p>
              <h2 className="text-2xl font-semibold">Performance overview</h2>
            </div>
            <Link to="/problem" className="button-primary">Resume problem</Link>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="rounded-xl border border-[var(--stroke)] bg-[var(--surface)] p-4">
                <p className="text-sm text-[var(--muted)]">{s.label}</p>
                <p className="text-2xl font-semibold">{s.value}</p>
                <p className="text-xs text-green-400">{s.trend}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 grid gap-4 lg:grid-cols-[1.6fr_1fr]">
            <div className="rounded-2xl border border-[var(--stroke)] bg-[var(--surface)] p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-[var(--muted)]">Domain mastery</p>
                <span className="rounded-full bg-[var(--surface-strong)] px-3 py-1 text-xs">Live</span>
              </div>
              <div className="mt-3 space-y-3">
                {domains.map((d) => (
                  <div key={d.name}>
                    <div className="flex items-center justify-between text-sm">
                      <p className="font-medium">{d.name}</p>
                      <p className="text-[var(--muted)]">{d.progress}%</p>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-[var(--stroke)]">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${d.color}`}
                        style={{ width: `${d.progress}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-[var(--stroke)] bg-[var(--surface)] p-4">
              <p className="text-sm text-[var(--muted)]">Upcoming</p>
              <div className="mt-3 space-y-3">
                {events.map((e) => (
                  <div key={e.title} className="rounded-xl border border-[var(--stroke)] bg-[var(--surface-strong)] px-4 py-3">
                    <p className="text-sm font-semibold">{e.title}</p>
                    <p className="text-xs text-[var(--muted)]">{e.time}</p>
                    <span className="mt-2 inline-flex rounded-full bg-[var(--surface)] px-3 py-1 text-xs text-[var(--muted)]">{e.tag}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="glass rounded-2xl p-5 shadow-soft">
            <p className="text-sm text-[var(--muted)]">Announcements</p>
            <div className="mt-3 space-y-3">
              <div className="rounded-xl border border-[var(--stroke)] bg-[var(--surface)] p-3">
                <p className="text-sm font-semibold">New: FPGA & VLSI track</p>
                <p className="text-xs text-[var(--muted)]">Added 24 practice problems and 3 labs</p>
              </div>
              <div className="rounded-xl border border-[var(--stroke)] bg-[var(--surface)] p-3">
                <p className="text-sm font-semibold">Signals module updated</p>
                <p className="text-xs text-[var(--muted)]">Fresh diagrams for sampling/aliasing cases</p>
              </div>
            </div>
          </div>

          <div className="glass rounded-2xl p-5 shadow-soft">
            <p className="text-sm text-[var(--muted)]">Recent activity</p>
            <div className="mt-3 space-y-3">
              {activity.map((a) => (
                <div key={a.title} className="flex items-center justify-between rounded-xl border border-[var(--stroke)] bg-[var(--surface)] px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold">{a.title}</p>
                    <p className="text-xs text-[var(--muted)]">{a.time}</p>
                  </div>
                  <span className="text-lg">⏺</span>
                </div>
              ))}
            </div>
          </div>

          <div className="glass rounded-2xl p-5 shadow-soft">
            <p className="text-sm text-[var(--muted)]">Quick actions</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link to="/problem" className="button-primary">Solve a problem</Link>
              <Link to="/library" className="button-ghost">Upload notes</Link>
              <Link to="/dashboard" className="button-ghost">Schedule quiz</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
