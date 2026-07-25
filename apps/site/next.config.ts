import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { NextConfig } from 'next'

/** The monorepo root (apps/site → ../..). */
const repoRoot = resolve(fileURLToPath(new URL('.', import.meta.url)), '../..')

const nextConfig: NextConfig = {
  // The Turbopack root must be the MONOREPO root, not this package. pnpm's isolated linker puts
  // every real dependency (including next itself) in the root `node_modules/.pnpm` store and
  // symlinks into `apps/site/node_modules`; with the root pinned to this package, Turbopack
  // refuses to compile through those symlinks ("files outside of the project directory will not
  // be compiled") and the build fails to find next/package.json.
  //
  // NOTE: do NOT also set `outputFileTracingRoot` — Next 16 requires the two to be identical and
  // errors when they differ. It isn't needed anyway: every page is statically prerendered, so the
  // repo's docs/*.md and CHANGELOG.md are read at BUILD time only.
  turbopack: { root: repoRoot },
}

export default nextConfig
