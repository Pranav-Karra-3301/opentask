import type { Metadata } from 'next'
import Link from 'next/link'
import { ApiReference } from '@/components/api-reference'
import { REPO_URL } from '@/lib/site'

export const metadata: Metadata = {
  title: 'API reference',
  description:
    'The complete OpenTask REST API: every route, request and response schema, generated from the server’s own OpenAPI document.',
  alternates: { canonical: '/api' },
}

export default function ApiPage() {
  return (
    <div className="mx-auto max-w-[var(--site-max)] px-5 py-10">
      <div className="max-w-[var(--site-prose)]">
        <h1 className="font-semibold text-4xl text-text-primary tracking-[-0.025em]">
          API reference
        </h1>
        <p className="mt-3 text-[15px] text-text-secondary leading-relaxed">
          Generated from the server’s own OpenAPI document, so it is exactly what your instance
          serves. Authenticate with a scoped <code className="font-mono text-[13px]">ot_…</code>{' '}
          token from <strong className="text-text-primary">Settings → Integrations</strong>, and
          send it as <code className="font-mono text-[13px]">Authorization: Bearer</code>. Your own
          instance also serves this interactively at{' '}
          <code className="font-mono text-[13px]">/api/v1/docs</code>.
        </p>
        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-[13px]">
          <Link href="/docs/api" className="text-accent hover:underline">
            API guide
          </Link>
          <a href="/openapi.json" className="text-accent hover:underline">
            openapi.json
          </a>
          <a
            href={`${REPO_URL}/blob/main/docs/api.md`}
            target="_blank"
            rel="noreferrer"
            className="text-text-tertiary hover:text-text-primary"
          >
            Edit on GitHub
          </a>
        </div>
      </div>

      {/* Scalar brings its own layout and scroll behaviour; give it the full width below the
          page's own heading rather than fighting it inside the prose column. */}
      <div className="-mx-5 mt-8">
        <ApiReference />
      </div>
    </div>
  )
}
