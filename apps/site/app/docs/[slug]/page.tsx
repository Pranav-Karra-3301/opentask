import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { listDocSlugs, loadDoc } from '@/lib/markdown'
import { REPO_URL } from '@/lib/site'

/** Fully static: every docs page is generated from docs/*.md at build time. */
export const dynamicParams = false

export async function generateStaticParams() {
  return (await listDocSlugs()).map((slug) => ({ slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const slugs = await listDocSlugs()
  if (!slugs.includes(slug)) return {}
  const doc = await loadDoc(slug)
  return {
    title: doc.title,
    alternates: { canonical: `/docs/${slug}` },
    openGraph: { title: `${doc.title} | OpenTask`, url: `/docs/${slug}` },
  }
}

export default async function DocPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const slugs = await listDocSlugs()
  if (!slugs.includes(slug)) notFound()
  const doc = await loadDoc(slug)

  return (
    <div className="gap-10 xl:grid xl:grid-cols-[1fr_180px]">
      <article className="min-w-0">
        <h1 className="font-semibold text-4xl text-text-primary tracking-[-0.025em]">
          {doc.title}
        </h1>
        <div className="mt-3 flex items-center gap-3 text-[13px] text-text-tertiary">
          <a
            href={`${REPO_URL}/blob/main/docs/${slug}.md`}
            target="_blank"
            rel="noreferrer"
            className="hover:text-text-primary"
          >
            Edit this page on GitHub
          </a>
        </div>
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: build-time render of the repo's own docs */}
        <div className="prose mt-8" dangerouslySetInnerHTML={{ __html: doc.html }} />
      </article>

      {doc.toc.length > 1 && (
        <nav aria-label="On this page" className="mt-10 hidden xl:mt-0 xl:block">
          <div className="sticky top-20">
            <p className="font-medium text-[12px] text-text-tertiary uppercase tracking-[0.08em]">
              On this page
            </p>
            <ul className="mt-3 space-y-2 border-border border-l">
              {doc.toc.map((entry) => (
                <li key={entry.id}>
                  <a
                    href={`#${entry.id}`}
                    className="-ml-px block border-transparent border-l pl-3 text-[13px] text-text-tertiary leading-snug transition-colors hover:border-accent hover:text-text-primary"
                  >
                    {entry.text}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </nav>
      )}
    </div>
  )
}
