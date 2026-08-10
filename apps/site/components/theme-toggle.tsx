'use client'

import { useEffect, useState } from 'react'

const KEY = 'ot-site-theme'

/**
 * Light/dark toggle. The initial DOM state is set by the pre-paint script in layout.tsx, so this
 * component only reads it back on mount — it must never decide the theme itself, or it would
 * flip the page after hydration.
 */
export function ThemeToggle() {
  const [dark, setDark] = useState<boolean | null>(null)

  useEffect(() => {
    setDark(document.documentElement.getAttribute('data-theme') === 'dark')
  }, [])

  function toggle() {
    const next = !(dark ?? false)
    setDark(next)
    document.documentElement.toggleAttribute('data-theme', false)
    if (next) document.documentElement.setAttribute('data-theme', 'dark')
    else document.documentElement.removeAttribute('data-theme')
    try {
      localStorage.setItem(KEY, next ? 'dark' : 'light')
    } catch {
      // private mode — the toggle still works for this page view
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      // Rendered before mount too, so the header does not reflow on hydration; the label is
      // only accurate once `dark` is known.
      aria-label={dark === null ? 'Toggle theme' : dark ? 'Switch to light' : 'Switch to dark'}
      className="grid size-9 place-items-center rounded-sm text-text-secondary transition-colors hover:bg-hover hover:text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      <svg
        width="17"
        height="17"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {dark ? (
          <>
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
          </>
        ) : (
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
        )}
      </svg>
    </button>
  )
}
