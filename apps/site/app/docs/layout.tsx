import { DocsNav } from '@/components/docs-nav'
import { DOC_ORDER, DOC_TITLES, listDocSlugs } from '@/lib/markdown'

/**
 * Docs shell. The nav order comes from DOC_ORDER (which mirrors docs/README.md's table), but the
 * list is reconciled against what is actually on disk, so a NEW docs page shows up automatically
 * instead of being silently omitted — the failure mode the plan called out.
 */
export default async function DocsLayout({ children }: { children: React.ReactNode }) {
  const slugs = await listDocSlugs()
  const ordered = [
    ...DOC_ORDER.filter((slug) => slugs.includes(slug)),
    ...slugs.filter((slug) => !DOC_ORDER.includes(slug as (typeof DOC_ORDER)[number])).sort(),
  ]
  const items = ordered.map((slug) => ({
    slug,
    title: DOC_TITLES[slug] ?? slug.replace(/-/g, ' '),
  }))

  return (
    <div className="mx-auto max-w-[var(--site-max)] gap-10 px-5 py-10 lg:grid lg:grid-cols-[210px_1fr]">
      <aside className="mb-8 lg:mb-0">
        <DocsNav items={items} />
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  )
}
