import Link from 'next/link'
import { Logo } from '@/components/logo'
import { DEMO_URL, REPO_URL } from '@/lib/site'

const GROUPS = [
  {
    title: 'Product',
    links: [
      { href: '/demo', label: 'Live demo' },
      { href: '/changelog', label: 'Changelog' },
      { href: `${REPO_URL}/releases`, label: 'Releases', external: true },
    ],
  },
  {
    title: 'Docs',
    links: [
      { href: '/docs/install', label: 'Install' },
      { href: '/docs/configuration', label: 'Configuration' },
      { href: '/docs/api', label: 'REST API' },
      { href: '/docs/faq', label: 'FAQ' },
    ],
  },
  {
    title: 'Source',
    links: [
      { href: REPO_URL, label: 'GitHub', external: true },
      { href: `${REPO_URL}/blob/main/LICENSE`, label: 'AGPL-3.0', external: true },
      { href: `${REPO_URL}/issues`, label: 'Issues', external: true },
    ],
  },
]

export function Footer() {
  return (
    <footer className="mt-24 border-border border-t bg-surface">
      <div className="mx-auto grid max-w-[var(--site-max)] gap-10 px-5 py-12 sm:grid-cols-2 lg:grid-cols-[1.5fr_repeat(3,1fr)]">
        <div>
          <div className="flex items-center gap-2 font-semibold text-text-primary">
            <Logo className="size-6 text-brand" />
            OpenTask
          </div>
          <p className="mt-3 max-w-xs text-[13px] text-text-tertiary leading-relaxed">
            A task manager you run yourself. One container, one volume, one account — no cloud, no
            subscription, no second user you never wanted.
          </p>
          <a
            href={DEMO_URL}
            className="mt-4 inline-block rounded-sm bg-accent px-3.5 py-2 font-medium text-[13px] text-on-accent transition-colors hover:bg-accent-hover"
          >
            Try the demo
          </a>
        </div>
        {GROUPS.map((group) => (
          <div key={group.title}>
            <h2 className="font-medium text-[13px] text-text-primary">{group.title}</h2>
            <ul className="mt-3 space-y-2">
              {group.links.map((link) => (
                <li key={link.label}>
                  {link.external ? (
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[13px] text-text-tertiary transition-colors hover:text-text-primary"
                    >
                      {link.label}
                    </a>
                  ) : (
                    <Link
                      href={link.href}
                      className="text-[13px] text-text-tertiary transition-colors hover:text-text-primary"
                    >
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-border border-t">
        <div className="mx-auto flex max-w-[var(--site-max)] flex-wrap items-center justify-between gap-2 px-5 py-5 text-[12px] text-text-tertiary">
          <p>
            Built by{' '}
            <a
              href="https://pranavkarra.me"
              className="text-text-secondary hover:text-text-primary"
            >
              Pranav Karra
            </a>
            . AGPL-3.0.
          </p>
          {/* Required by the mark's CC BY 3.0 licence — see assets/brand/ATTRIBUTION.md. */}
          <p>
            Icon derived from{' '}
            <a
              href="https://thenounproject.com/browse/icons/term/list/"
              target="_blank"
              rel="noreferrer"
              className="text-text-secondary hover:text-text-primary"
            >
              “List” by Glyphy
            </a>{' '}
            (CC BY 3.0).
          </p>
        </div>
      </div>
    </footer>
  )
}
