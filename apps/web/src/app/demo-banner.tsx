/**
 * Demo-instance banner — renders only when the server reports `demo_mode` on /api/v1/info,
 * so a self-hosted instance never pays for it (the component returns null before any state
 * or timer is created).
 *
 * The countdown is honest about what happens: the demo container wipes /data and re-seeds on
 * a timer (deploy/demo/entrypoint.sh), so anything a visitor types here is genuinely gone.
 * Saying so up front is the difference between "this app lost my data" and "I was warned".
 *
 * At zero the server is mid-restart, so we stop counting and say so rather than showing a
 * negative timer or silently freezing at 0:00.
 */
import { useEffect, useState } from 'react'
import { useDemo } from '@/api/hooks/info'

const SITE_URL = 'https://opentask.pranavkarra.me'

/** Whole seconds until `iso`, floored at 0. */
function secondsUntil(iso: string): number {
  return Math.max(0, Math.round((Date.parse(iso) - Date.now()) / 1000))
}

function formatCountdown(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

export function DemoBanner() {
  const demo = useDemo()
  const resetsAt = demo?.resets_at ?? null
  const [remaining, setRemaining] = useState(() => (resetsAt === null ? 0 : secondsUntil(resetsAt)))

  useEffect(() => {
    if (resetsAt === null) return
    setRemaining(secondsUntil(resetsAt))
    const id = setInterval(() => setRemaining(secondsUntil(resetsAt)), 1000)
    return () => clearInterval(id)
  }, [resetsAt])

  if (demo === null) return null

  return (
    <div
      // Deliberately NOT a live region (no role="status"/aria-live): the countdown rewrites
      // itself every second, and a live region would make screen readers announce the whole
      // banner on every tick. It is persistent page furniture, discoverable in DOM order at
      // the top of the content column — which is where it belongs.
      className="flex shrink-0 flex-wrap items-center justify-center gap-x-2 gap-y-1 border-border-subtle border-b bg-accent-soft px-4 py-1.5 text-caption text-text-secondary"
    >
      <span className="font-medium text-text-primary">Demo instance</span>
      <span aria-hidden="true">·</span>
      <span>
        {remaining === 0 ? (
          'resetting now'
        ) : (
          <>
            resets in{' '}
            <span className="font-medium tabular-nums text-text-primary">
              {formatCountdown(remaining)}
            </span>
          </>
        )}
      </span>
      <span aria-hidden="true">·</span>
      <span>nothing you do here is saved</span>
      <a
        href={SITE_URL}
        target="_blank"
        rel="noreferrer"
        className="font-medium text-accent underline-offset-2 outline-none hover:underline focus-visible:underline"
      >
        Self-host it
      </a>
    </div>
  )
}
