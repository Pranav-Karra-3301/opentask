import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { Metadata } from 'next'
import { DOCS_DIR, renderMarkdown } from '@/lib/markdown'

export const metadata: Metadata = {
  title: 'Documentation',
  description:
    'Install and configure your OpenTask instance, import from Todoist, capture by voice, back up and restore, and drive the REST API and CLI.',
  alternates: { canonical: '/docs' },
}

/** The index is docs/README.md itself — the same page GitHub shows, minus its own h1. */
export default async function DocsIndex() {
  const raw = await readFile(join(DOCS_DIR, 'README.md'), 'utf8')
  const body = raw.replace(/^#\s+.+$/m, '')
  const html = await renderMarkdown(body, 'docs')

  return (
    <article className="min-w-0">
      <h1 className="font-semibold text-4xl text-text-primary tracking-[-0.025em]">
        Documentation
      </h1>
      {/* biome-ignore lint/security/noDangerouslySetInnerHtml: build-time render of the repo's own docs */}
      <div className="prose mt-8" dangerouslySetInnerHTML={{ __html: html }} />
    </article>
  )
}
