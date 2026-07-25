'use client'

import { useEffect, useState } from 'react'

/** Copy-to-clipboard with a transient confirmation. Falls back silently where the API is absent. */
export function CopyButton({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const id = setTimeout(() => setCopied(false), 1600)
    return () => clearTimeout(id)
  }, [copied])

  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard?.writeText(text).then(
          () => setCopied(true),
          () => {},
        )
      }}
      aria-label={`${label}: ${text}`}
      className="shrink-0 rounded-sm border border-border bg-surface-raised px-2.5 py-1.5 font-medium text-[12px] text-text-secondary transition-colors hover:bg-hover hover:text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      {copied ? 'Copied' : label}
    </button>
  )
}
