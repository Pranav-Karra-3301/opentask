import type { Metadata } from 'next'
import { loadChangelog } from '@/lib/markdown'
import { REPO_URL } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Changelog',
  description: 'Every OpenTask release, generated from the repository CHANGELOG.',
  alternates: { canonical: '/changelog' },
}

/** Render the release date as written by git-cliff (YYYY-MM-DD), in a stable locale. */
function formatDate(date: string | null): string | null {
  if (date === null) return null
  const parsed = new Date(`${date}T00:00:00Z`)
  if (Number.isNaN(parsed.getTime())) return date
  return parsed.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  })
}

export default async function ChangelogPage() {
  const releases = await loadChangelog()

  return (
    <div className="mx-auto max-w-[var(--site-max)] px-5 py-12">
      <div className="max-w-[var(--site-prose)]">
        <h1 className="font-semibold text-4xl text-text-primary tracking-[-0.025em]">Changelog</h1>
        <p className="mt-3 text-[15px] text-text-secondary">
          Generated from{' '}
          <a
            href={`${REPO_URL}/blob/main/CHANGELOG.md`}
            target="_blank"
            rel="noreferrer"
            className="text-accent hover:underline"
          >
            CHANGELOG.md
          </a>
          , which git-cliff writes from the commit history.
        </p>
      </div>

      <div className="mt-12 max-w-[var(--site-prose)] space-y-10">
        {releases.map((release) => (
          <section key={release.version} className="scroll-mt-20" id={`v${release.version}`}>
            <div className="flex flex-wrap items-baseline gap-3">
              <h2 className="font-semibold text-2xl text-text-primary tracking-[-0.02em]">
                <a href={`#v${release.version}`} className="hover:text-accent">
                  {release.version}
                </a>
              </h2>
              {release.date !== null && (
                <time
                  dateTime={release.date}
                  className="font-mono text-[12.5px] text-text-tertiary"
                >
                  {formatDate(release.date)}
                </time>
              )}
              <a
                href={`${REPO_URL}/releases/tag/v${release.version}`}
                target="_blank"
                rel="noreferrer"
                className="ml-auto text-[13px] text-text-tertiary hover:text-text-primary"
              >
                Release notes →
              </a>
            </div>
            {/* biome-ignore lint/security/noDangerouslySetInnerHtml: build-time render of the repo's own changelog */}
            <div className="prose mt-4" dangerouslySetInnerHTML={{ __html: release.html }} />
          </section>
        ))}
      </div>
    </div>
  )
}
