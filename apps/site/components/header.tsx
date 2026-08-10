import Link from 'next/link'
import { Logo } from '@/components/logo'
import { ThemeToggle } from '@/components/theme-toggle'
import { DEMO_URL, REPO_URL } from '@/lib/site'

const NAV = [
  { href: '/docs', label: 'Docs' },
  { href: '/api', label: 'API' },
  { href: '/changelog', label: 'Changelog' },
  { href: '/demo', label: 'Demo' },
]

/**
 * Floating pill nav. The page has exactly one background colour and no section dividers, so the
 * header cannot lean on a bottom border to separate itself from the content. Instead it is an
 * inset rounded bar that sits *on* the page: content scrolls under a translucent, blurred
 * surface, which reads as depth without drawing a line across the layout.
 */
export function Header() {
  return (
    <div className="sticky top-0 z-40 px-4 pt-3 pb-1 sm:px-6 sm:pt-4">
      <header className="mx-auto flex max-w-[var(--site-max)] items-center gap-1 rounded-full border border-border/70 bg-bg/70 px-2.5 py-2 shadow-[0_1px_2px_rgb(0_0_0/0.04),0_8px_24px_-16px_rgb(0_0_0/0.25)] backdrop-blur-xl sm:px-3">
        <Link
          href="/"
          className="mr-auto flex items-center gap-2 rounded-full px-2 py-1 font-semibold text-[15px] text-text-primary transition-colors hover:bg-hover/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          <Logo className="size-5 text-brand" />
          OpenTask
        </Link>
        <nav className="flex items-center gap-0.5" aria-label="Main">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-2.5 py-1.5 text-[13.5px] text-text-secondary transition-colors hover:bg-hover/70 hover:text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:px-3 sm:text-[14px]"
            >
              {item.label}
            </Link>
          ))}
          <a
            href={REPO_URL}
            target="_blank"
            rel="noreferrer"
            className="hidden rounded-full px-3 py-1.5 text-[14px] text-text-secondary transition-colors hover:bg-hover/70 hover:text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent md:block"
          >
            GitHub
          </a>
        </nav>
        <ThemeToggle />
        <a
          href={DEMO_URL}
          className="ml-0.5 hidden rounded-full bg-accent px-4 py-1.5 font-medium text-[14px] text-on-accent transition-colors hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:block"
        >
          Try it
        </a>
      </header>
    </div>
  )
}
