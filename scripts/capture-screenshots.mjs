/**
 * Capture the README + marketing-site screenshots against a real, seeded OpenTask instance.
 *
 * Pipeline (all throwaway state in an OS temp dir, torn down on exit):
 *   1. ensure the web app is built (`apps/web/dist`) — the server serves it as the SPA
 *   2. seed a fresh SQLite DB via `pnpm seed` (creates the demo user + the frozen dataset)
 *   3. boot the server (`tsx src/index.ts`) on a random port, serving that dist + DB
 *   4. drive headless Chromium (1440x900 @2x) through the SHOTS table below, once in light
 *      and once in dark, then again at a phone viewport for the mobile shots
 *   5. optimise every PNG into WebP at two widths, into the site's public dir
 *   6. tear everything down
 *
 * Outputs (see SHOTS): `docs/screenshots/<name>.png` and `<name>-dark.png`. The three names the
 * README embeds — hero, hero-dark, quick-add — are load-bearing and MUST NOT be renamed; the
 * run asserts they exist before it exits.
 *
 * AS-BUILT notes (verified against the repo; the pipeline is unforgiving about these):
 *   - The server has NO build step / no `apps/server/dist` — it runs through `tsx` (see
 *     apps/server/package.json `start`). We therefore start it with `pnpm --filter
 *     @opentask/server start` and point it at the *web* build via OPENTASK_WEB_DIST, so a
 *     single origin serves both the API and the SPA (app.ts static-SPA fallback). All web
 *     API/auth calls are same-origin relative (api/client.ts `BASE='/api/v1'`; auth/client.ts
 *     omits baseURL), so no separate web server or proxy is needed.
 *   - Playwright's `chromium` is imported from `@playwright/test` (a direct web devDependency);
 *     the bare `playwright` package is not hoisted. We resolve it through the web workspace with
 *     `createRequire` — no new dependency is added.
 *   - A random high port (overridable via OPENTASK_SCREENSHOT_PORT) keeps parallel build agents
 *     from colliding, per the crew's "unique random ports" rule.
 *   - Seed runs BEFORE the server starts (zero connection overlap on the WAL DB).
 *   - NEVER `waitForLoadState('networkidle')`: the app holds a long-lived SSE connection
 *     (/api/v1/events), so the network never goes idle — the same as-built pitfall
 *     playwright.config.ts documents. Each shot declares its own `ready` locator instead.
 *   - DARK MODE: the appearance axis is `data-mode="dark"` on <html> (lib/theme.ts) — NOT
 *     `data-theme`, which appears nowhere in tokens.css. An earlier revision of this script
 *     toggled `data-theme` and silently produced a *light* image named `hero-dark.png`. It is
 *     also not enough to stamp the attribute by hand: `useThemeSync` re-applies the appearance
 *     from the account settings on mount and would overwrite it. We PATCH the real setting
 *     (`/api/v1/user/settings { appearance }`) and reload, driving the app's own code path,
 *     then assert `data-mode` actually landed.
 *   - DEMO MODE MUST BE OFF here: OPENTASK_DEMO_MODE would render the demo banner
 *     (app/demo-banner.tsx) into every screenshot.
 */
import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { mkdir, mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { setTimeout as sleep } from 'node:timers/promises'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)))
const OUT_REL = 'docs/screenshots'
const OUT_DIR = join(ROOT, OUT_REL)
/** The site consumes optimised WebP derivatives of the same captures. */
const SITE_IMG_DIR = join(ROOT, 'apps/site/public/screenshots')
const WEB_DIST = join(ROOT, 'apps/web/dist')
const require = createRequire(join(ROOT, 'apps/web/package.json'))
const { chromium } = require('@playwright/test')

const PORT = Number(
  process.env.OPENTASK_SCREENSHOT_PORT ?? 20000 + Math.floor(Math.random() * 40000),
)
const ORIGIN = `http://localhost:${PORT}`
const DEMO = { email: 'demo@opentask.local', password: 'opentask-demo' }
const VIEWPORT = { width: 1440, height: 900 }
/** iPhone-15-ish logical viewport, for the PWA/mobile story on the site. */
const MOBILE_VIEWPORT = { width: 390, height: 844 }
/** Widths emitted as WebP for the site's <img srcset>. */
const WEBP_WIDTHS = [1440, 720]

/** A task row is the app's "this view has rendered real data" signal. */
const taskRow = (page) => page.locator('[id^="task-"]').first()

/** Everything that counts as "content" when measuring how far down a view actually extends. */
const CONTENT = [
  'main h1',
  'main h2',
  'main h3',
  'main [id^="task-"]',
  'main button',
  'main a',
  'main [role="button"]',
]
/** Full app width, trimmed to where the content actually stops. */
const fitContent = { fit: CONTENT, pad: 28, fullWidth: true, minHeight: 460 }
/** A centred dialog, with enough padding that it still reads as sitting inside the app. */
const fitDialog = { fit: ['[role="dialog"]'], pad: 130, minHeight: 420 }

/**
 * The capture table. Each shot navigates, waits for its own `ready` signal, optionally runs
 * `prepare`, is captured, then optionally `cleanup`s any state it persisted.
 *
 * `href: null` + `click:` resolves the target by its visible sidebar name, so no project or
 * filter id is ever hardcoded against the seed.
 */
const SHOTS = [
  {
    name: 'hero',
    frame: fitContent,
    href: '/today',
    ready: taskRow,
    caption: 'Today — overdue section, priority colors, sidebar',
  },
  {
    name: 'upcoming',
    frame: fitContent,
    href: '/upcoming',
    ready: (page) => page.getByRole('heading', { name: /^\w+ \d{4}$/ }).first(),
    caption: 'Upcoming — the week strip with drag-between-days',
  },
  {
    name: 'project',
    frame: fitContent,
    href: null,
    click: 'Work',
    ready: taskRow,
    caption: 'A project in list layout, with sections',
  },
  {
    name: 'board',
    frame: fitContent,
    href: null,
    click: 'Work',
    ready: taskRow,
    caption: 'The same project as a kanban board',
    prepare: async ({ page }) => {
      await page.getByRole('button', { name: /display/i }).click()
      const menu = page.locator('[role="dialog"], [role="menu"]').last()
      await menu.getByRole('button', { name: 'Board', exact: true }).click()
      await sleep(600)
      await page.keyboard.press('Escape')
      await sleep(400)
    },
    /** Layout is a persisted per-view preference — undo it so later shots see a list again. */
    cleanup: async ({ page }) => {
      await page.getByRole('button', { name: /display/i }).click()
      const menu = page.locator('[role="dialog"], [role="menu"]').last()
      await menu.getByRole('button', { name: 'List', exact: true }).click()
      await sleep(400)
      await page.keyboard.press('Escape')
      await sleep(300)
    },
  },
  {
    name: 'filter',
    frame: fitContent,
    href: null,
    click: 'Priority focus',
    ready: taskRow,
    caption: 'A saved filter from the Todoist filter language',
  },
  {
    name: 'reporting',
    frame: fitContent,
    href: '/reporting',
    ready: (page) => page.getByRole('heading', { name: 'Reporting' }).first(),
    caption: 'Productivity — goals, streaks, karma, activity history',
  },
  {
    name: 'quick-add',
    frame: fitDialog,
    href: '/today',
    ready: taskRow,
    keepFocus: true,
    caption: 'Quick Add parsing natural language into structured fields',
    prepare: async ({ page }) => {
      await page.keyboard.press('q')
      await page.getByRole('dialog', { name: 'Quick add task' }).waitFor({ state: 'visible' })
      const input = page.getByRole('textbox', { name: 'Quick add task' })
      // Trailing space: it closes the final `@deep-work` token, so the label-autocomplete
      // popover is not left open (it would clip at the viewport edge in the capture).
      await input.fill('Prepare launch notes tomorrow 9am p2 #Work @deep-work ')
      // Wait for the live highlighter to tokenise (any [data-kind] chip means it parsed).
      await page.locator('[data-kind]').first().waitFor({ state: 'visible', timeout: 10_000 })
      await sleep(400)
    },
    cleanup: async ({ page }) => {
      await page.keyboard.press('Escape')
      await sleep(300)
    },
  },
  {
    name: 'palette',
    frame: fitDialog,
    href: '/today',
    ready: taskRow,
    keepFocus: true,
    caption: 'The ⌘K command palette',
    prepare: async ({ page }) => {
      await page.keyboard.press('Meta+k')
      await page.getByRole('dialog', { name: 'Command palette' }).waitFor({ state: 'visible' })
      await sleep(500)
    },
    cleanup: async ({ page }) => {
      await page.keyboard.press('Escape')
      await sleep(300)
    },
  },
  {
    name: 'mobile',
    href: '/today',
    ready: taskRow,
    mobile: true,
    caption: 'The installable PWA on a phone',
  },
]

/** Run a command to completion; reject with captured output on a non-zero exit. */
function run(cmd, args, env) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(cmd, args, { cwd: ROOT, env: { ...process.env, ...env } })
    let out = ''
    child.stdout.on('data', (d) => {
      out += d
    })
    child.stderr.on('data', (d) => {
      out += d
    })
    child.on('error', reject)
    child.on('exit', (code) =>
      code === 0
        ? resolvePromise(out)
        : reject(new Error(`${cmd} ${args.join(' ')} exited ${code}\n${out}`)),
    )
  })
}

/** Boot the server as a long-lived child; resolve once /api/health reports ok. */
async function startServer(dataDir) {
  const child = spawn('pnpm', ['--filter', '@opentask/server', 'start'], {
    cwd: ROOT,
    env: {
      ...process.env,
      OPENTASK_DATA_DIR: dataDir,
      OPENTASK_PORT: String(PORT),
      OPENTASK_WEB_DIST: WEB_DIST,
      OPENTASK_PUBLIC_URL: ORIGIN,
      OPENTASK_DISABLE_UPDATE_CHECK: 'true',
      OPENTASK_LOG_LEVEL: 'warn',
      // Explicitly off: the demo banner must never appear in a marketing screenshot.
      OPENTASK_DEMO_MODE: 'false',
    },
  })
  let log = ''
  child.stdout.on('data', (d) => {
    log += d
  })
  child.stderr.on('data', (d) => {
    log += d
  })
  let exited = false
  child.on('exit', () => {
    exited = true
  })

  for (let i = 0; i < 60; i++) {
    if (exited) throw new Error(`server exited during boot\n${log}`)
    try {
      const res = await fetch(`${ORIGIN}/api/health`)
      if (res.ok) {
        const body = await res.json()
        if (body?.status === 'ok') return child
      }
    } catch {
      // not up yet
    }
    await sleep(1000)
  }
  throw new Error(`server /api/health never came up on ${ORIGIN}\n${log}`)
}

/** Read a PNG's pixel dimensions from its IHDR chunk. */
async function pngSize(file) {
  const head = await readFile(file)
  return `${head.readUInt32BE(16)}x${head.readUInt32BE(20)}`
}

/** Log in as the seeded demo user and land on Today. */
async function login(page) {
  await page.goto(`${ORIGIN}/login`, { waitUntil: 'domcontentloaded' })
  await page.fill('input[name="email"]', DEMO.email)
  await page.fill('input[name="password"]', DEMO.password)
  await page.click('button[type="submit"]')
  await page.waitForURL('**/today', { timeout: 20_000 })
  await taskRow(page).waitFor({ state: 'visible', timeout: 20_000 })
}

/**
 * Switch the appearance through the app's real mechanism: PATCH the account settings, then
 * reload so `useThemeSync` applies it. Stamping `data-mode` by hand would be undone by the
 * next settings-driven render — see the DARK MODE note at the top of this file.
 */
async function setAppearance(page, appearance) {
  const res = await page.evaluate(async (value) => {
    const r = await fetch('/api/v1/user/settings', {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ appearance: value }),
    })
    return { ok: r.ok, status: r.status, body: await r.text() }
  }, appearance)
  if (!res.ok) throw new Error(`could not set appearance=${appearance}: ${res.status} ${res.body}`)
  await page.reload({ waitUntil: 'domcontentloaded' })
  await taskRow(page).waitFor({ state: 'visible', timeout: 20_000 })
  const mode = await page.evaluate(() => document.documentElement.getAttribute('data-mode'))
  if (mode !== appearance) {
    throw new Error(`appearance did not apply: data-mode=${mode}, expected ${appearance}`)
  }
}

/** Navigate to a shot's target, either by URL or by clicking a sidebar entry. */
async function navigate(page, shot) {
  if (shot.href !== null && shot.href !== undefined) {
    await page.goto(ORIGIN + shot.href, { waitUntil: 'domcontentloaded' })
  } else {
    await page.getByRole('link', { name: shot.click, exact: true }).first().click()
  }
  await shot.ready(page).waitFor({ state: 'visible', timeout: 20_000 })
  await page.evaluate(() => document.fonts.ready)
  await sleep(400)
}

/**
 * Park the cursor and drop focus before capturing.
 *
 * Driving the UI with a real mouse leaves artefacts that look like bugs in a marketing shot:
 * the pointer sits wherever the last click landed (leaving a hover state — e.g. the board's
 * trailing "Add section" column lit up), and the last-clicked control keeps a :focus-visible
 * ring. Parking the pointer in the empty bottom-centre of the scroll area clears the hover;
 * blurring clears the ring.
 *
 * Shots whose subject IS a focused surface (Quick Add's input, the command palette) opt out
 * with `keepFocus` — blurring those would close or visually break the thing being shown.
 */
async function settle(page, shot, viewport) {
  await page.mouse.move(Math.round(viewport.width / 2), viewport.height - 40)
  if (shot.keepFocus !== true) {
    await page.evaluate(() => {
      const el = document.activeElement
      if (el instanceof HTMLElement) el.blur()
    })
  }
  await sleep(350)
}

/**
 * Work out the crop for a shot, so the figure frames its subject instead of a screenful of
 * empty scroll area. The seed dataset is small — Today holds three tasks — so an uncropped
 * 1440x900 capture is mostly blank canvas and the interesting part renders tiny on the site.
 *
 * `frame.fit` is a list of selectors whose union bounding box is the subject. `fullWidth` keeps
 * the whole app width (so the sidebar stays in the picture) and trims only vertically, which is
 * what the list/board views want; the dialog shots crop on both axes with generous padding so
 * the dialog still reads as sitting inside the app.
 *
 * Returns undefined (= full viewport) when a shot declares no frame or nothing matched.
 */
async function computeClip(page, shot, viewport) {
  if (!shot.frame) return undefined
  const { fit, pad = 28, fullWidth = false, minHeight = 0 } = shot.frame
  const box = await page.evaluate(
    ({ selectors, vw, vh }) => {
      let left = Infinity
      let top = Infinity
      let right = -Infinity
      let bottom = -Infinity
      let found = false
      for (const selector of selectors) {
        for (const el of document.querySelectorAll(selector)) {
          const r = el.getBoundingClientRect()
          // Skip zero-size, off-screen, and full-height scroll containers — any of them
          // would drag the box back out to the whole viewport and defeat the crop.
          if (r.width <= 0 || r.height <= 0) continue
          if (r.bottom <= 0 || r.top >= vh || r.right <= 0 || r.left >= vw) continue
          if (r.height >= vh) continue
          found = true
          left = Math.min(left, r.left)
          top = Math.min(top, r.top)
          right = Math.max(right, r.right)
          bottom = Math.max(bottom, r.bottom)
        }
      }
      return found ? { left, top, right, bottom } : null
    },
    { selectors: fit, vw: viewport.width, vh: viewport.height },
  )
  if (!box) return undefined

  const x = fullWidth ? 0 : Math.max(0, Math.floor(box.left - pad))
  const right = fullWidth ? viewport.width : Math.min(viewport.width, Math.ceil(box.right + pad))
  let y = Math.max(0, Math.floor(box.top - pad))
  let bottom = Math.min(viewport.height, Math.ceil(box.bottom + pad))

  // Sparse views (the saved filter holds two tasks) crop down to a letterbox sliver that
  // renders ~120px tall on the site. Grow back to a floor — downward first, then upward —
  // so every figure keeps a sane aspect ratio.
  if (bottom - y < minHeight) {
    bottom = Math.min(viewport.height, y + minHeight)
    if (bottom - y < minHeight) y = Math.max(0, bottom - minHeight)
  }

  const width = right - x
  const height = bottom - y
  // A crop that saved nothing is not worth the odd aspect ratio.
  if (width < 200 || height < 150) return undefined
  return { x, y, width, height }
}

/** Capture one shot at the current appearance. Returns { file, width, height }. */
async function capture(page, shot, suffix, viewport) {
  await navigate(page, shot)
  if (shot.prepare) await shot.prepare({ page, sleep })
  await settle(page, shot, viewport)
  const clip = await computeClip(page, shot, viewport)
  const file = join(OUT_DIR, `${shot.name}${suffix}.png`)
  await page.screenshot({ path: file, ...(clip ? { clip } : {}) })
  if (shot.cleanup) await shot.cleanup({ page, sleep })
  return {
    file,
    width: clip?.width ?? viewport.width,
    height: clip?.height ?? viewport.height,
  }
}

/**
 * Emit WebP derivatives into the site's public dir. `sharp` is already a root devDependency
 * (scripts/generate-icons.mjs is the precedent), so this adds no new dependency.
 */
async function optimise(shots) {
  const { default: sharp } = await import('sharp')
  await mkdir(SITE_IMG_DIR, { recursive: true })
  let written = 0
  for (const { file } of shots) {
    const base = file
      .split('/')
      .pop()
      .replace(/\.png$/, '')
    const meta = await sharp(file).metadata()
    for (const width of WEBP_WIDTHS) {
      // Never upscale — a 390px-wide mobile capture has no business becoming 1440.
      if (meta.width < width) continue
      const out = join(SITE_IMG_DIR, `${base}-${width}.webp`)
      await sharp(file).resize({ width }).webp({ quality: 82 }).toFile(out)
      written++
    }
  }
  return written
}

async function main() {
  // 1. Build the web app if the SPA the server serves is missing.
  if (!existsSync(join(WEB_DIST, 'index.html'))) {
    console.log('building web app (apps/web/dist missing)…')
    await run('pnpm', ['--filter', '@opentask/web', 'build'], {})
  }

  const dataDir = await mkdtemp(join(tmpdir(), 'opentask-shots-'))
  let server = null
  let browser = null
  try {
    // 2. Seed the frozen dataset (creates the demo user + demo data) into the fresh DB.
    console.log('seeding demo data…')
    await run('pnpm', ['--filter', '@opentask/server', 'seed'], {
      OPENTASK_DATA_DIR: dataDir,
      OPENTASK_DISABLE_UPDATE_CHECK: 'true',
    })

    // 3. Boot the server serving that DB + the web build.
    console.log(`starting server on ${ORIGIN}…`)
    server = await startServer(dataDir)

    // 4. Drive the browser.
    browser = await chromium.launch()
    const shots = []
    const pageErrors = []

    const desktop = SHOTS.filter((s) => s.mobile !== true)
    const mobile = SHOTS.filter((s) => s.mobile === true)

    for (const { viewport, scope, label } of [
      { viewport: VIEWPORT, scope: desktop, label: 'desktop' },
      { viewport: MOBILE_VIEWPORT, scope: mobile, label: 'mobile' },
    ]) {
      if (scope.length === 0) continue
      const context = await browser.newContext({ viewport, deviceScaleFactor: 2 })
      const page = await context.newPage()
      page.on('pageerror', (err) => pageErrors.push(`[${label}] ${err}`))
      await login(page)

      for (const [appearance, suffix] of [
        ['light', ''],
        ['dark', '-dark'],
      ]) {
        await setAppearance(page, appearance)
        for (const shot of scope) {
          console.log(`  ${label}/${appearance}: ${shot.name}`)
          shots.push(await capture(page, shot, suffix, viewport))
        }
      }
      await context.close()
    }

    if (pageErrors.length > 0) {
      throw new Error(`page raised ${pageErrors.length} error(s):\n${pageErrors.join('\n')}`)
    }

    for (const { file } of shots) {
      console.log(`wrote ${OUT_REL}/${file.split('/').pop()} (${await pngSize(file)})`)
    }

    // 5. WebP derivatives for the site, plus a dimensions manifest. Each shot is cropped to
    // its own subject now, so they no longer share one aspect ratio and the site cannot
    // hardcode 1440x900 without causing layout shift.
    const written = await optimise(shots)
    const manifest = Object.fromEntries(
      shots.map(({ file, width, height }) => [
        file
          .split('/')
          .pop()
          .replace(/\.png$/, ''),
        { width, height },
      ]),
    )
    await writeFile(
      join(SITE_IMG_DIR, 'manifest.json'),
      `${JSON.stringify(manifest, null, 2)}\n`,
      'utf8',
    )
    console.log(
      `wrote ${written} webp derivative(s) + manifest.json to apps/site/public/screenshots/`,
    )

    // Guard the README's embeds — renaming these silently breaks the repo's front page.
    const present = new Set(await readdir(OUT_DIR))
    for (const required of ['hero.png', 'hero-dark.png', 'quick-add.png']) {
      if (!present.has(required)) throw new Error(`README screenshot missing: ${required}`)
    }
  } finally {
    if (browser) await browser.close().catch(() => {})
    if (server) {
      server.kill('SIGTERM')
      await new Promise((r) => {
        server.on('exit', r)
        setTimeout(() => {
          server.kill('SIGKILL')
          r()
        }, 5000)
      })
    }
    await rm(dataDir, { recursive: true, force: true }).catch(() => {})
  }
}

main().catch((err) => {
  console.error(err.message ?? err)
  process.exit(1)
})
