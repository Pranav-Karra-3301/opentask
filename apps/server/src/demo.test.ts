import { afterEach, describe, expect, it, test } from 'vitest'
import { InfoDtoSchema } from './api/schemas'
import { loadConfig } from './config'
import { DEMO_BLOCKED_API_PREFIXES, DEMO_EMAIL, DEMO_PASSWORD, demoBlockReason } from './demo'
import { createTestApp, json, type TestApp } from './test/helpers'

let apps: TestApp[] = []
async function make(opts?: Parameters<typeof createTestApp>[0]): Promise<TestApp> {
  const t = await createTestApp(opts)
  apps.push(t)
  return t
}
/** A signed-up instance with the demo guard active. */
const demo = () => make({ env: { OPENTASK_DEMO_MODE: 'true' } })

afterEach(() => {
  for (const t of apps) t.close()
  apps = []
})

describe('config', () => {
  test('demo mode is off by default', () => {
    const c = loadConfig({})
    expect(c.demoMode).toBe(false)
    expect(c.demoResetSeconds).toBe(1800)
  })

  test('OPENTASK_DEMO_MODE also forces the update check off', () => {
    const c = loadConfig({ OPENTASK_DEMO_MODE: 'true' })
    expect(c.demoMode).toBe(true)
    expect(c.disableUpdateCheck).toBe(true)
  })

  test('OPENTASK_DEMO_RESET_SECONDS overrides the interval', () => {
    expect(loadConfig({ OPENTASK_DEMO_RESET_SECONDS: '90' }).demoResetSeconds).toBe(90)
  })

  test('a sub-minute reset interval fails validation', () => {
    expect(() => loadConfig({ OPENTASK_DEMO_RESET_SECONDS: '5' })).toThrow()
  })

  test('the legacy OPENDOIST_ spelling still works', () => {
    expect(loadConfig({ OPENDOIST_DEMO_MODE: 'yes' }).demoMode).toBe(true)
  })
})

describe('demoBlockReason', () => {
  test('reads are never blocked, including on guarded prefixes', () => {
    for (const { prefix } of DEMO_BLOCKED_API_PREFIXES) {
      expect(demoBlockReason('GET', `/api/v1${prefix}`), prefix).toBeNull()
    }
  })

  test('every guarded prefix blocks writes, including subpaths', () => {
    for (const { prefix } of DEMO_BLOCKED_API_PREFIXES) {
      expect(demoBlockReason('POST', `/api/v1${prefix}`), prefix).not.toBeNull()
      expect(demoBlockReason('DELETE', `/api/v1${prefix}/abc123`), prefix).not.toBeNull()
    }
  })

  test('the core task surfaces stay writable', () => {
    for (const path of [
      '/api/v1/tasks',
      '/api/v1/tasks/quick',
      '/api/v1/tasks/abc/close',
      '/api/v1/projects',
      '/api/v1/sections',
      '/api/v1/labels',
      '/api/v1/filters',
      '/api/v1/comments',
      '/api/v1/user/settings',
      '/api/v1/reminders',
    ]) {
      expect(demoBlockReason('POST', path), path).toBeNull()
    }
  })

  test('PATCH /user is blocked exactly, without catching /user/settings', () => {
    // The display name is global chrome; the settings document is how you try the product.
    expect(demoBlockReason('PATCH', '/api/v1/user')).not.toBeNull()
    expect(demoBlockReason('PATCH', '/api/v1/user/settings')).toBeNull()
    expect(demoBlockReason('GET', '/api/v1/user')).toBeNull()
  })

  test('a prefix match is on a path segment, not a substring', () => {
    // `/tokens` is blocked; `/tokensomething` must not be caught by it.
    expect(demoBlockReason('POST', '/api/v1/tokensomething')).toBeNull()
    // `/push-subscriptions` is blocked but the public VAPID key read is a different path.
    expect(demoBlockReason('GET', '/api/v1/push/vapid-public-key')).toBeNull()
  })

  test('account and credential mutations are blocked at any method', () => {
    for (const path of [
      '/api/auth/change-password',
      '/api/auth/change-email',
      '/api/auth/update-user',
      '/api/auth/delete-user',
      '/api/auth/two-factor/enable',
      '/api/auth/api-key/create',
    ]) {
      expect(demoBlockReason('POST', path), path).not.toBeNull()
    }
  })

  test('signing in and out stay open — the demo is unusable otherwise', () => {
    expect(demoBlockReason('POST', '/api/auth/sign-in/email')).toBeNull()
    expect(demoBlockReason('POST', '/api/auth/sign-out')).toBeNull()
    expect(demoBlockReason('GET', '/api/auth/get-session')).toBeNull()
  })
})

describe('/api/v1/info', () => {
  it('reports demo_mode: null on a normal instance', async () => {
    const t = await make()
    const info = InfoDtoSchema.parse(await json<unknown>(await t.request('/api/v1/info')))
    expect(info.demo_mode).toBeNull()
  })

  it('publishes the credentials and a future reset time in demo mode', async () => {
    const t = await demo()
    const info = InfoDtoSchema.parse(await json<unknown>(await t.request('/api/v1/info')))
    expect(info.demo_mode).not.toBeNull()
    expect(info.demo_mode?.email).toBe(DEMO_EMAIL)
    expect(info.demo_mode?.password).toBe(DEMO_PASSWORD)
    expect(info.demo_mode?.reset_seconds).toBe(1800)
    const resetsAt = Date.parse(info.demo_mode?.resets_at ?? '')
    expect(resetsAt).toBeGreaterThan(Date.now())
    expect(resetsAt).toBeLessThanOrEqual(Date.now() + 1800 * 1000)
  })

  it('anchors the countdown at boot, so it does not drift between requests', async () => {
    const t = await demo()
    const first = InfoDtoSchema.parse(await json<unknown>(await t.request('/api/v1/info')))
    await new Promise((r) => setTimeout(r, 25))
    const second = InfoDtoSchema.parse(await json<unknown>(await t.request('/api/v1/info')))
    expect(second.demo_mode?.resets_at).toBe(first.demo_mode?.resets_at)
  })
})

describe('the guard over a real app', () => {
  it('refuses guarded writes with a demo-mode problem document', async () => {
    const t = await demo()
    const res = await t.post('/api/v1/channels', { type: 'webhook', url: 'https://evil.test' })
    expect(res.status).toBe(403)
    expect(res.headers.get('content-type')).toContain('application/problem+json')
    const body = await json<{ type: string; title: string; detail: string }>(res)
    expect(body.title).toBe('demo mode')
    expect(body.type).toContain('demo-mode')
    expect(body.detail).toContain('public demo')
  })

  it('still lets a visitor create a task — the whole point of the demo', async () => {
    const t = await demo()
    const res = await t.post('/api/v1/tasks/quick', { text: 'Try OpenTask tomorrow 9am p1' })
    expect(res.status).toBe(201)
  })

  it('leaves those same writes working on a normal instance', async () => {
    const t = await make()
    const res = await t.post('/api/v1/channels', { type: 'webhook', url: 'https://evil.test' })
    expect(res.status).not.toBe(403)
  })

  it('blocks a password change that would lock out the next visitor', async () => {
    const t = await demo()
    const res = await t.request('/api/auth/change-password', {
      method: 'POST',
      headers: { cookie: t.cookie, 'content-type': 'application/json' },
      body: JSON.stringify({ currentPassword: 'password1234', newPassword: 'hijacked12345' }),
    })
    expect(res.status).toBe(403)
  })

  it('still allows sign-in, so the published credentials work', async () => {
    const t = await demo()
    const res = await t.request('/api/auth/sign-in/email', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com', password: 'password1234' }),
    })
    expect(res.status).toBe(200)
  })
})
