/**
 * Emit the OpenAPI document to `apps/site/public/openapi.json`, so the site can render the real
 * API reference (Scalar) without a live instance.
 *
 * Why the spec is generated and COMMITTED rather than fetched at build time:
 *   - Vercel installs only `@opentask/site`'s dependency closure (`--filter @opentask/site...`),
 *     so the server package and better-sqlite3 do not exist in that build. Nothing there can
 *     produce the document.
 *   - Pointing Scalar at a live instance would need CORS, which the self-hosted server
 *     deliberately does not ship, and would break whenever the demo is mid-reset.
 *
 * Run `pnpm openapi` after changing any route, and commit the result. `pnpm verify` checks it is
 * current (see `--check`), so a stale spec fails CI rather than silently shipping.
 *
 * The document is produced the same way the server's own `/api/v1/openapi.json` route does: build
 * the real app against a throwaway data dir and ask it. No server is started.
 */
import { mkdtempSync, rmSync } from 'node:fs'
import { readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)))
const OUT = join(ROOT, 'apps/site/public/openapi.json')
const OUT_REL = 'apps/site/public/openapi.json'
const check = process.argv.includes('--check')

/**
 * Build the document from the real app. This script is RUN UNDER tsx (see the `openapi` npm
 * script) because the server is TypeScript with no build step, and tsx is a dependency of
 * @opentask/server rather than the workspace root, so it cannot be `register`ed from here.
 */
async function buildDocument() {
  const serverSrc = join(ROOT, 'apps/server/src')
  const { createApp } = await import(`${serverSrc}/app.ts`)
  const { createAuth } = await import(`${serverSrc}/auth.ts`)
  const { loadConfig } = await import(`${serverSrc}/config.ts`)
  const { openDb } = await import(`${serverSrc}/db/db.ts`)
  const { EventBus } = await import(`${serverSrc}/events/bus.ts`)
  const { createLogger } = await import(`${serverSrc}/logger.ts`)
  const { ensureDataDirAndSecrets } = await import(`${serverSrc}/secrets.ts`)

  const dataDir = mkdtempSync(join(tmpdir(), 'opentask-openapi-'))
  try {
    const config = loadConfig({
      OPENTASK_DATA_DIR: dataDir,
      OPENTASK_LOG_LEVEL: 'silent',
      OPENTASK_DISABLE_UPDATE_CHECK: 'true',
      // Pinned so the document does not churn with every version bump.
      OPENTASK_VERSION: 'latest',
    })
    const secrets = ensureDataDirAndSecrets(config.dataDir)
    const { db, sqlite } = openDb(join(config.dataDir, 'opentask.db'))
    const auth = createAuth(db, config, secrets.sessionSecret)
    const app = createApp({
      config,
      db,
      sqlite,
      secrets,
      bus: new EventBus(),
      auth,
      logger: createLogger(config),
    })
    const res = await app.request('/api/v1/openapi.json')
    if (!res.ok) throw new Error(`openapi.json returned ${res.status}`)
    const doc = await res.json()
    sqlite.close()
    return doc
  } finally {
    rmSync(dataDir, { recursive: true, force: true })
  }
}

const doc = await buildDocument()
// Servers are not part of the generated document; add the demo so "Try it" has a target.
doc.servers = [
  { url: 'https://tryopentask.pranavkarra.me/api/v1', description: 'Public demo instance' },
  { url: 'http://localhost:7968/api/v1', description: 'Your own instance' },
]
const json = `${JSON.stringify(doc, null, 2)}\n`

if (check) {
  const current = await readFile(OUT, 'utf8').catch(() => null)
  if (current !== json) {
    console.error(`${OUT_REL} is out of date — run \`pnpm openapi\` and commit the result.`)
    process.exit(1)
  }
  console.log(`${OUT_REL} is up to date`)
} else {
  await writeFile(OUT, json, 'utf8')
  const paths = Object.keys(doc.paths ?? {}).length
  console.log(`wrote ${OUT_REL} (${paths} paths, openapi ${doc.openapi})`)
}
