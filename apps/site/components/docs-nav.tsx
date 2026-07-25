'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export interface DocsNavItem {
  slug: string
  title: string
}

/** Docs sidebar. Client-side only so it can mark the active page. */
export function DocsNav({ items }: { items: DocsNavItem[] }) {
  const pathname = usePathname()
  return (
    <nav aria-label="Documentation" className="lg:sticky lg:top-20">
      <p className="px-3 font-medium text-[12px] text-text-tertiary uppercase tracking-[0.08em]">
        Documentation
      </p>
      <ul className="mt-2 space-y-0.5">
        <li>
          <Link
            href="/docs"
            aria-current={pathname === '/docs' ? 'page' : undefined}
            className={`block rounded-sm px-3 py-1.5 text-[14px] transition-colors ${
              pathname === '/docs'
                ? 'bg-accent-soft font-medium text-accent'
                : 'text-text-secondary hover:bg-hover hover:text-text-primary'
            }`}
          >
            Overview
          </Link>
        </li>
        {items.map((item) => {
          const href = `/docs/${item.slug}`
          const active = pathname === href
          return (
            <li key={item.slug}>
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                className={`block rounded-sm px-3 py-1.5 text-[14px] transition-colors ${
                  active
                    ? 'bg-accent-soft font-medium text-accent'
                    : 'text-text-secondary hover:bg-hover hover:text-text-primary'
                }`}
              >
                {item.title}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
