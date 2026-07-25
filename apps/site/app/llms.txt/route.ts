import { DOC_TITLES, listDocSlugs } from '@/lib/markdown'
import { DEMO_URL, REPO_URL, SITE_URL } from '@/lib/site'

/**
 * /llms.txt — the llmstxt.org convention: a plain-text map of the site for language models,
 * generated from the same docs listing the nav uses so it cannot go stale.
 */
export const dynamic = 'force-static'

export async function GET() {
  const slugs = await listDocSlugs()
  const docLines = slugs
    .map((slug) => `- [${DOC_TITLES[slug] ?? slug}](${SITE_URL}/docs/${slug})`)
    .join('\n')

  const body = `# OpenTask

> Self-hosted, single-user, keyboard-first task manager — an open, Todoist-compatible
> alternative. One Docker container, one /data volume, one account. AGPL-3.0.

OpenTask implements the Todoist workflow (Quick Add grammar, filter language, keyboard map)
without the cloud or a subscription. It is deliberately single-user: there is no sharing,
no assignees, and no teams.

- Live demo: ${DEMO_URL} (demo@opentask.local / opentask-demo; resets every 30 minutes)
- Source: ${REPO_URL}
- Image: ghcr.io/pranav-karra-3301/opentask
- Install: docker run -d --name opentask -p 7968:7968 -v ./data:/data ghcr.io/pranav-karra-3301/opentask

## Docs

${docLines}

## Other

- [Changelog](${SITE_URL}/changelog)
- [Demo](${SITE_URL}/demo)

## Notes

- Priorities are stored 1 = highest (p1) … 4 = default (p4) — the inverse of Todoist's REST API.
- Not in scope: collaboration/sharing, CalDAV, calendar layout, email reminders, localization.
`

  return new Response(body, {
    headers: { 'content-type': 'text/plain; charset=utf-8' },
  })
}
