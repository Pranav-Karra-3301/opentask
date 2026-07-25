import Link from 'next/link'
import { Logo } from '@/components/logo'
import { ThemeToggle } from '@/components/theme-toggle'
import { DEMO_URL, REPO_URL } from '@/lib/site'

const NAV = [
  { href: '/docs', label: 'Docs' },
  { href: '/changelog', label: 'Changelog' },
  { href: '/demo', label: 'Demo' },
]

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-border border-b bg-bg/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-[var(--site-max)] items-center gap-1 px-5">
        <Link
          href="/"
          className="mr-auto flex items-center gap-2 rounded-sm font-semibold text-[15px] text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          <Logo className="size-6 text-brand" />
          OpenTask
        </Link>
        <nav className="flex items-center gap-0.5" aria-label="Main">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-sm px-3 py-2 text-[14px] text-text-secondary transition-colors hover:bg-hover hover:text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              {item.label}
            </Link>
          ))}
          <a
            href={REPO_URL}
            target="_blank"
            rel="noreferrer"
            className="hidden rounded-sm px-3 py-2 text-[14px] text-text-secondary transition-colors hover:bg-hover hover:text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:block"
          >
            GitHub
          </a>
        </nav>
        <ThemeToggle />
        <a
          href={DEMO_URL}
          className="ml-1 hidden rounded-sm bg-accent px-3.5 py-2 font-medium text-[14px] text-on-accent transition-colors hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:block"
        >
          Try it
        </a>
      </div>
    </header>
  )
}
