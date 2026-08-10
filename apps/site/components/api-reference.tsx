'use client'

import { ApiReferenceReact } from '@scalar/api-reference-react'
import '@scalar/api-reference-react/style.css'
import { useEffect, useState } from 'react'

/**
 * Scalar's interactive reference, rendered against the committed `/openapi.json`.
 *
 * The spec is generated from the real Hono app by `pnpm openapi` and committed, because the
 * Vercel build installs only this package's dependencies and so cannot produce it, and because
 * pointing Scalar at a live instance would need CORS headers the self-hosted server does not ship.
 *
 * Client-only: Scalar touches `window` on mount, and server-rendering it produces a hydration
 * mismatch against the interactive panels.
 */
export function ApiReference() {
  const [dark, setDark] = useState(false)

  useEffect(() => {
    const root = document.documentElement
    const sync = () => setDark(root.getAttribute('data-theme') === 'dark')
    sync()
    // The site's theme toggle stamps `data-theme`; Scalar needs to be told, not to guess.
    const observer = new MutationObserver(sync)
    observer.observe(root, { attributes: true, attributeFilter: ['data-theme'] })
    return () => observer.disconnect()
  }, [])

  return (
    <ApiReferenceReact
      configuration={{
        url: '/openapi.json',
        darkMode: dark,
        // The site owns the page chrome; Scalar renders the reference and nothing else.
        // This drops Scalar's own product bar (Developer Tools / Configure / Share / Deploy),
        // which is their SaaS funnel and pure noise on a self-hosted project's docs. The old
        // `showToolbar` spelling still works at runtime but has been Omit'ed from the public
        // type in favour of this one, so passing it fails typecheck.
        showDeveloperTools: 'never',
        hideDarkModeToggle: true,
        hideClientButton: true,
        documentDownloadType: 'json',
        // NB: "Ask AI" has no config flag (neither mcp.disabled nor customCss suppress it);
        // it is hidden by a rule in globals.css instead. See the note there.
      }}
    />
  )
}
