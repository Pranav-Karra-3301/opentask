# @opentask/site

The marketing and documentation site for OpenTask — [opentask.pranavkarra.me](https://opentask.pranavkarra.me).

Next.js (App Router) + Tailwind v4, styled from the app's own design tokens so the site and the
product are visibly the same thing.

## Why it lives in the monorepo

Content gravity. The site reads the repository's own files at **build time**:

| Page | Source |
|---|---|
| `/docs`, `/docs/[slug]` | `docs/*.md` |
| `/changelog` | `CHANGELOG.md` |
| Screenshots | `apps/site/public/screenshots/` (written by `pnpm screenshots`) |

There is no sync step to forget: editing `docs/install.md` ships with the next deploy. The
Markdown pipeline (`lib/markdown.ts`) rewrites GitHub-shaped cross-links (`install.md` →
`/docs/install`) and repo-relative asset paths so the same files keep rendering correctly on
GitHub too.

## Develop

```sh
pnpm --filter @opentask/site dev     # http://localhost:3100
pnpm --filter @opentask/site build
pnpm --filter @opentask/site start
```

Screenshots are not committed by this package — regenerate them from a real seeded instance:

```sh
pnpm screenshots
```

## Deploy (Vercel)

- **Root Directory:** `apps/site`
- **Include files outside root directory:** on (the build reads `docs/` and `CHANGELOG.md`)
- Install/build commands come from `vercel.json`.

## Notes

- Site constants (domains, the Docker one-liner) live in `lib/site.ts` — **not** in
  `app/layout.tsx`, which would create an import cycle with the header/footer.
- `next.config.ts` pins Turbopack's root to the **monorepo** root; pnpm's isolated linker keeps
  real dependencies in the root store and Turbopack must be allowed to compile through those
  symlinks.
