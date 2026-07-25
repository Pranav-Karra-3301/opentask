/**
 * Demo-mode credentials + the `OPENTASK_DEMO_MODE` write guard.
 *
 * The credentials are the single source of truth shared by `seed.ts` (which creates the
 * user) and `/api/v1/info` (which publishes them so the login page can prefill) — they
 * must never drift apart, or the demo's one-click login stops working.
 *
 * ---
 *
 * The guard is the security boundary for a *public* instance
 * (tryopentask.pranavkarra.me and any self-hosted sandbox).
 *
 * A demo is deliberately unauthenticated-in-spirit: the credentials are printed on the
 * marketing site, so every visitor is effectively an admin. That is fine for task data
 * (it is fake, and the container wipes itself on a timer — see deploy/demo/entrypoint.sh)
 * but NOT for the surfaces below, which either reach out of the box, write unbounded
 * bytes to disk, or would lock the next visitor out.
 *
 * Reads stay open everywhere: browsing Settings → Backups and finding it empty is a fine
 * demo experience, and the web hides the blocked pages anyway (settings registry
 * `demoBlocked`). Only mutations are refused, with a `demo mode` problem document the
 * client can recognise and render as a friendly toast.
 *
 * Everything NOT listed here stays fully live — tasks, projects, sections, labels,
 * filters, search, comments, quick add, recurrence, board/kanban, productivity, SSE,
 * export, and the settings that make the product look like itself.
 */
import type { MiddlewareHandler } from 'hono'
import type { Config } from './config'
import { problem } from './lib/problem'

/** The seeded demo account. Published by /info in demo mode — intentionally not a secret. */
export const DEMO_EMAIL = 'demo@opentask.local'
export const DEMO_PASSWORD = 'opentask-demo'
export const DEMO_NAME = 'Demo'

/**
 * `/api/v1` path prefixes whose mutations are refused. Each entry is matched against the
 * path with the `/api/v1` prefix stripped, so `/channels` covers `/channels/{id}/test`.
 *
 * Paths verified against the routers' OpenAPI `path:` literals — note the real spellings
 * are `/push-subscriptions` (not `/push`), `/ical-token`, and `/settings/integrations`.
 */
export const DEMO_BLOCKED_API_PREFIXES: readonly { prefix: string; why: string }[] = [
  // SSRF: a notification channel makes the SERVER POST to an operator-supplied URL.
  { prefix: '/channels', why: 'notification channels are' },
  // SSRF via a live Todoist API token, plus an unbounded ZIP upload.
  { prefix: '/import', why: 'importing is' },
  // Unbounded disk writes on a 1 GB box.
  { prefix: '/attachments', why: 'file attachments are' },
  { prefix: '/rambles', why: 'voice capture is' },
  // Restore takes the maintenance lock and would 503 the entire demo until the next wipe.
  { prefix: '/backups', why: 'backups and restore are' },
  // Long-lived credentials to a public instance.
  { prefix: '/tokens', why: 'API tokens are' },
  // Outbound push + VAPID; also pointless on an instance that resets every 30 minutes.
  { prefix: '/push-subscriptions', why: 'push notifications are' },
  // Mints public, un-expiring calendar feed URLs.
  { prefix: '/ical-token', why: 'the calendar feed is' },
  // Holds STT/LLM provider API keys.
  { prefix: '/settings/integrations', why: 'provider integrations are' },
]

/**
 * Exact paths (no subpath matching) whose mutations are refused.
 *
 * `PATCH /user` only accepts a display name — but that name is global chrome rendered on
 * every page for every visitor, which makes it a far more attractive vandalism target than
 * a task title buried in a list. Nothing is lost by refusing it: renaming yourself is not a
 * feature worth demoing, and Settings → Account is hidden in demo mode anyway.
 *
 * This MUST stay exact — `PATCH /user/settings` (theme, timezone, view prefs) is how a
 * visitor tries out the product and has to keep working.
 */
export const DEMO_BLOCKED_API_EXACT: readonly { path: string; why: string }[] = [
  { path: '/user', why: 'changing the account profile is' },
]

/**
 * better-auth paths refused outright (all are POST). The account mutations matter most:
 * a visitor changing the demo password or deleting the user bricks the instance for
 * everyone else until the next wipe. Sign-in and sign-out stay open, obviously.
 */
export const DEMO_BLOCKED_AUTH_PATHS: readonly string[] = [
  '/api/auth/change-password',
  '/api/auth/change-email',
  '/api/auth/update-user',
  '/api/auth/delete-user',
  // Enrolling 2FA on a shared account locks everyone else out just as hard.
  '/api/auth/two-factor',
  // The api-key plugin's own HTTP surface — the /api/v1/tokens block above is not enough.
  '/api/auth/api-key',
]

const READ_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])

/**
 * The pure decision, exported so it can be table-tested without booting an app.
 * Returns the blocked surface's description, or `null` when the request may proceed.
 */
export function demoBlockReason(method: string, path: string): string | null {
  for (const p of DEMO_BLOCKED_AUTH_PATHS) {
    if (path === p || path.startsWith(`${p}/`)) return 'account and credential changes are'
  }
  if (READ_METHODS.has(method.toUpperCase())) return null
  if (!path.startsWith('/api/v1/')) return null
  const rest = path.slice('/api/v1'.length)
  for (const { path: exact, why } of DEMO_BLOCKED_API_EXACT) {
    if (rest === exact) return why
  }
  for (const { prefix, why } of DEMO_BLOCKED_API_PREFIXES) {
    if (rest === prefix || rest.startsWith(`${prefix}/`)) return why
  }
  return null
}

/**
 * No-op unless `OPENTASK_DEMO_MODE` is set, so a self-hosted instance is byte-identical.
 * Registered before the better-auth handler so it covers `/api/auth` and `/api/v1` alike.
 */
export function demoGuard(config: Config): MiddlewareHandler {
  return async (c, next) => {
    if (!config.demoMode) return next()
    const why = demoBlockReason(c.req.method, c.req.path)
    if (why === null) return next()
    return problem(
      c,
      403,
      'demo mode',
      `This is a public demo — ${why} disabled. Self-host OpenTask to use this feature.`,
    )
  }
}
