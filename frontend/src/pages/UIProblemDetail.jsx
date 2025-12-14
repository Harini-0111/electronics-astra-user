import React from 'react'

const tags = ['Circuits', 'Analog', 'Medium', 'Timing']

export default function UIProblemDetail() {
  return (
    <div className="space-y-6">
      <div className="glass rounded-2xl p-6 shadow-soft">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm text-[var(--muted)]">Problem</p>
            <h2 className="text-2xl font-semibold">Design a 2nd-order active low-pass filter (Sallen-Key)</h2>
            <div className="mt-2 flex flex-wrap gap-2 text-xs text-[var(--muted)]">
              {tags.map((t) => (
                <span key={t} className="rounded-full bg-[var(--surface-strong)] px-3 py-1">{t}</span>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button className="button-ghost">Hints</button>
            <button className="button-primary">Submit</button>
          </div>
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-4">
            <div className="rounded-2xl border border-[var(--stroke)] bg-[var(--surface)] p-4">
              <p className="text-sm text-[var(--muted)]">Statement</p>
              <p className="mt-2 text-sm text-[var(--text)] leading-relaxed">
                Design a unity-gain Sallen-Key low-pass filter with cutoff 5 kHz, Q ≈ 0.707 (Butterworth).
                Provide component values (R, C), expected magnitude response, and explain stability considerations.
              </p>
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-[var(--muted)]">
                <li>Assume ideal op-amp, ±12V supply</li>
                <li>Target passband ripple &lt; 0.5 dB</li>
                <li>Provide Bode magnitude sketch and -3 dB point</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-[var(--stroke)] bg-[var(--surface)] p-4">
              <p className="text-sm text-[var(--muted)]">Workspace</p>
              <div className="mt-2 h-48 rounded-xl border border-[var(--stroke)] bg-[var(--surface-strong)] p-3 text-sm text-[var(--muted)]">
                Add your derivation, formulas, and circuit diagram here.
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                <button className="rounded-xl bg-[var(--surface-strong)] px-3 py-2 text-sm">Attach PDF</button>
                <button className="rounded-xl bg-[var(--surface-strong)] px-3 py-2 text-sm">Attach Image</button>
                <button className="rounded-xl bg-[var(--surface-strong)] px-3 py-2 text-sm">Add Simulation Link</button>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="rounded-2xl border border-[var(--stroke)] bg-[var(--surface)] p-4">
              <p className="text-sm text-[var(--muted)]">Test cases</p>
              <ul className="mt-2 space-y-2 text-sm text-[var(--muted)]">
                <li>✔️ Gain ≈ 0 dB at 1 kHz</li>
                <li>✔️ -3 dB at ~5 kHz</li>
                <li>✔️ -40 dB/decade beyond 50 kHz</li>
                <li>⬜ Phase margin &gt; 45°</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-[var(--stroke)] bg-[var(--surface)] p-4">
              <p className="text-sm text-[var(--muted)]">Related</p>
              <div className="mt-2 space-y-2 text-sm text-[var(--muted)]">
                <p>Butterworth vs. Chebyshev filters</p>
                <p>Active filter stability with finite GBP</p>
                <p>Component tolerance and Q drift</p>
              </div>
            </div>
            <div className="rounded-2xl border border-[var(--stroke)] bg-[var(--surface)] p-4">
              <p className="text-sm text-[var(--muted)]">Discussion</p>
              <p className="mt-2 text-sm text-[var(--muted)]">Join the thread to compare designs, share schematics, and review Bode plots.</p>
              <button className="mt-3 w-full rounded-xl bg-[var(--surface-strong)] px-3 py-2 text-sm">Open forum</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
